import { useEffect, useRef, useState } from 'react';
import type { DependencyList } from 'react';
import { visionEngine } from './VisionEngine';
import { isPhaseReady, getVisionMessage } from './VisionMessages';
import type { VisionFrame, VisionPhase, VisionDebugStats, VisionErrorInfo } from './types/VisionTypes';

export interface UseVisionSystemResult {
  phase: VisionPhase;
  isReady: boolean;
  starting: boolean;
  stream: MediaStream | null;
  error: VisionErrorInfo | null;
  message: { title: string; subtitle: string };
  retry: () => void;
}

/**
 * Starts (or reuses, if already running) the shared VisionEngine and exposes
 * its state machine. Cheap to render against — only updates when the phase
 * string actually changes.
 */
export function useVisionSystem(requiredPlayers: 1 | 2, player2Name = 'Player 2'): UseVisionSystemResult {
  const [phase, setPhase] = useState<VisionPhase>(visionEngine.getPhase());
  const [starting, setStarting] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(visionEngine.getStream());
  const [error, setError] = useState<VisionErrorInfo | null>(visionEngine.getError());
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStarting(true);

    visionEngine
      .start()
      .then(() => {
        if (cancelled) return;
        setStream(visionEngine.getStream());
        setError(null);
        setStarting(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(visionEngine.getError());
        setStarting(false);
      });

    const unsubPhase = visionEngine.subscribePhase(setPhase);
    setPhase(visionEngine.getPhase());

    return () => {
      cancelled = true;
      unsubPhase();
    };
  }, [retryToken]);

  return {
    phase,
    isReady: isPhaseReady(phase, requiredPlayers),
    starting,
    stream,
    error,
    message: getVisionMessage(phase, requiredPlayers, player2Name),
    retry: () => setRetryToken((t) => t + 1),
  };
}

/**
 * Subscribes a callback to every processed vision frame. Use this for
 * imperative per-frame game logic (pose sampling, gesture matching) — call
 * `setState` inside the callback only when something meaningful changes,
 * not unconditionally.
 */
export function useVisionFrameSubscription(callback: (frame: VisionFrame) => void, deps: DependencyList): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return visionEngine.subscribe((frame) => callbackRef.current(frame));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * A ref that always holds the latest vision frame, updated outside React's
 * render cycle. Use this for canvas overlays that redraw on their own
 * animation-frame loop instead of forcing a React re-render every frame.
 */
export function useVisionFrameRef() {
  const frameRef = useRef<VisionFrame>(visionEngine.getLatestFrame());

  useEffect(() => {
    return visionEngine.subscribe((frame) => {
      frameRef.current = frame;
    });
  }, []);

  return frameRef;
}

/** Throttled (5Hz) debug stats for the development-only vision HUD. */
export function useVisionDebugStats(requiredPlayers: 1 | 2): VisionDebugStats {
  const [stats, setStats] = useState<VisionDebugStats>(() => visionEngine.getDebugStats(requiredPlayers));

  useEffect(() => {
    const id = window.setInterval(() => {
      setStats(visionEngine.getDebugStats(requiredPlayers));
    }, 200);
    return () => window.clearInterval(id);
  }, [requiredPlayers]);

  return stats;
}
