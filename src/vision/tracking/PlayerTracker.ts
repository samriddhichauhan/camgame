import type { BodyLandmark, PersonDetection, PlayerBoundingBox, TrackingState } from '../types/VisionTypes';

// A new detection must match an existing slot's last known center within this
// normalized distance (0-1 coordinate space) to be considered "the same person".
const MATCH_MAX_DISTANCE = 0.35;

// A brand-new candidate must be seen for this many consecutive frames before
// it is promoted to a confirmed player. Prevents a single noisy detection
// from flipping player state.
const CONFIRM_FRAMES = 4;

// Once a tracked player stops being detected, keep their last known pose for
// this long before dropping them. Prevents flicker from momentary occlusion.
const GRACE_PERIOD_MS = 900;

export type SlotState = 'empty' | 'candidate' | 'tracked' | 'lost';

export interface PlayerSlotSnapshot {
  id: 'player-1' | 'player-2';
  state: SlotState;
  detection: PersonDetection | null; // present only when a fresh detection was matched this frame
  confidence: number;
  boundingBox: PlayerBoundingBox | null;
  landmarks: BodyLandmark[] | null; // frozen last-known landmarks while 'lost'
  visibility: number;
}

interface InternalSlot {
  id: 'player-1' | 'player-2';
  state: SlotState;
  center: { x: number; y: number } | null;
  lastSeenAt: number;
  candidateFrames: number;
  lastConfidence: number;
  lastBoundingBox: PlayerBoundingBox | null;
  lastLandmarks: BodyLandmark[] | null;
  lastVisibility: number;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export class PlayerTracker {
  private slots: [InternalSlot, InternalSlot] = [
    { id: 'player-1', state: 'empty', center: null, lastSeenAt: 0, candidateFrames: 0, lastConfidence: 0, lastBoundingBox: null, lastLandmarks: null, lastVisibility: 0 },
    { id: 'player-2', state: 'empty', center: null, lastSeenAt: 0, candidateFrames: 0, lastConfidence: 0, lastBoundingBox: null, lastLandmarks: null, lastVisibility: 0 },
  ];

  reset(): void {
    for (const slot of this.slots) {
      slot.state = 'empty';
      slot.center = null;
      slot.lastSeenAt = 0;
      slot.candidateFrames = 0;
      slot.lastConfidence = 0;
      slot.lastBoundingBox = null;
      slot.lastLandmarks = null;
      slot.lastVisibility = 0;
    }
  }

  /**
   * Feed the latest raw person detections. Returns a per-slot snapshot the
   * caller (VisionEngine) uses to decide which slots need pose estimation
   * this frame, and which should keep showing frozen last-known landmarks.
   */
  update(detections: PersonDetection[], now: number): PlayerSlotSnapshot[] {
    const claimed = new Set<number>();

    // 1. Match existing (tracked / lost / candidate) slots to the nearest
    // unclaimed detection, so identity survives brief detector noise.
    for (const slot of this.slots) {
      if (slot.state === 'empty' || !slot.center) continue;

      let bestIdx = -1;
      let bestDist = MATCH_MAX_DISTANCE;
      detections.forEach((det, idx) => {
        if (claimed.has(idx)) return;
        const d = distance(slot.center!, { x: det.centerX, y: det.centerY });
        if (d < bestDist) {
          bestDist = d;
          bestIdx = idx;
        }
      });

      if (bestIdx !== -1) {
        claimed.add(bestIdx);
        const det = detections[bestIdx];
        slot.center = { x: det.centerX, y: det.centerY };
        slot.lastSeenAt = now;
        slot.lastConfidence = det.confidence;
        slot.lastBoundingBox = det.boundingBox;
        if (slot.state === 'candidate') {
          slot.candidateFrames += 1;
          if (slot.candidateFrames >= CONFIRM_FRAMES) {
            slot.state = 'tracked';
          }
        } else if (slot.state === 'lost') {
          slot.state = 'tracked';
        }
      } else {
        // No match this frame.
        if (slot.state === 'candidate') {
          // Unconfirmed candidates don't get a grace period — just drop them.
          slot.state = 'empty';
          slot.center = null;
          slot.candidateFrames = 0;
        } else if (slot.state === 'tracked') {
          slot.state = 'lost';
        } else if (slot.state === 'lost' && now - slot.lastSeenAt > GRACE_PERIOD_MS) {
          slot.state = 'empty';
          slot.center = null;
          slot.lastBoundingBox = null;
          slot.lastLandmarks = null;
        }
      }
    }

    // 2. Assign leftover unclaimed detections to empty slots.
    const unclaimed = detections
      .map((det, idx) => ({ det, idx }))
      .filter(({ idx }) => !claimed.has(idx))
      .map(({ det }) => det);

    const emptySlots = this.slots.filter((s) => s.state === 'empty');

    if (emptySlots.length === 2 && unclaimed.length > 0) {
      // Fresh start with (potentially) two people already in frame.
      // Camera feed is mirrored for the on-screen selfie view, so a player
      // standing on the viewer's screen-LEFT has a HIGHER raw x (closer to 1.0)
      // in the unmirrored detection coordinates. Sort screen-left-first.
      const sorted = [...unclaimed].sort((a, b) => b.centerX - a.centerX);
      const forP1 = sorted[0];
      const forP2 = sorted[1];
      if (forP1) this.seedCandidate(this.slots[0], forP1, now);
      if (forP2) this.seedCandidate(this.slots[1], forP2, now);
    } else if (emptySlots.length === 1 && unclaimed.length > 0) {
      // Only one open slot — whoever just appeared takes it, no re-sorting
      // of the already-tracked player.
      this.seedCandidate(emptySlots[0], unclaimed[0], now);
    }

    // 3. Build the snapshot the engine consumes.
    return this.slots.map((slot) => ({
      id: slot.id,
      state: slot.state,
      detection:
        slot.state === 'tracked' && slot.center
          ? ({
              id: 0,
              boundingBox: slot.lastBoundingBox!,
              confidence: slot.lastConfidence,
              centerX: slot.center.x,
              centerY: slot.center.y,
              width: slot.lastBoundingBox!.width,
              height: slot.lastBoundingBox!.height,
            } satisfies PersonDetection)
          : null,
      confidence: slot.lastConfidence,
      boundingBox: slot.lastBoundingBox,
      landmarks: slot.lastLandmarks,
      visibility: slot.lastVisibility,
    }));
  }

  /** Called by the engine after running pose estimation for a tracked slot this frame. */
  recordLandmarks(id: 'player-1' | 'player-2', landmarks: BodyLandmark[], visibility: number): void {
    const slot = this.slots.find((s) => s.id === id);
    if (!slot) return;
    slot.lastLandmarks = landmarks;
    slot.lastVisibility = visibility;
  }

  getSlotState(id: 'player-1' | 'player-2'): SlotState {
    return this.slots.find((s) => s.id === id)!.state;
  }

  private seedCandidate(slot: InternalSlot, det: PersonDetection, now: number): void {
    slot.state = 'candidate';
    slot.center = { x: det.centerX, y: det.centerY };
    slot.lastSeenAt = now;
    slot.candidateFrames = 1;
    slot.lastConfidence = det.confidence;
    slot.lastBoundingBox = det.boundingBox;
  }

  getTrackingStateForOutput(id: 'player-1' | 'player-2'): TrackingState {
    const state = this.getSlotState(id);
    return state === 'lost' ? 'lost' : 'tracked';
  }
}
