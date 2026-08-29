# 👁️ VYBE Computer Vision & Tracking Engine Architecture

This document details the real-time, browser-native computer vision pipeline that powers **VYBE**.

---

## 🏗️ High-Level Pipeline Architecture

VYBE uses Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision`) running 100% locally inside the web browser via WebAssembly (WASM) and WebGL:

```
Camera Feed (WebRTC MediaStream)
   │
   ▼
Fixed Offscreen Video Element (VisionEngine.ts)
   │
   ▼
PersonDetector (MediaPipe PoseLandmarker & ObjectDetector)
   │  ├── Strictly Monotonic Timestamps
   │  └── 33 3D Normalized Keypoints per person
   │
   ▼
PersonPoseEstimator (Vector Normalization & Joint Angles)
   │
   ▼
PlayerTracker (Spatial X-Coordinate Sorting & Stable Index Assignment)
   │  └── 900ms Grace Period for Temporary Occlusion
   │
   ▼
VisionEngine Event Emitter (60 FPS requestAnimationFrame)
   │
   ▼
Game Components & Landmark Canvas Overlays
```

---

## 🧩 Core Components

### 1. `VisionEngine.ts`
- **Singleton Manager**: Controls WebRTC stream initialization, offscreen video decoding, model loading, and `requestAnimationFrame` loop execution.
- **Offscreen Video**: Attached persistently to `document.body` with fixed position to prevent browser decoding throttling.

### 2. `PersonDetector.ts` & `PersonPoseEstimator.ts`
- **Landmark Extraction**: Extracts 33 3D body keypoints (`x`, `y`, `z`, `visibility`, `presence`) per detected person.
- **Monotonic Timestamp Guarantee**: Ensures MediaPipe timestamp parameters increase monotonically (`timestamp = Math.max(timestamp, lastTimestamp + 1)`).

### 3. `PlayerTracker.ts`
- **Spatial Left-to-Right Sorting**: Sorts detected persons by bounding box centroid `centerX`. Person on screen-left is assigned `playerIndex: 1`, person on screen-right is assigned `playerIndex: 2`.
- **Temporal Stability**: Implements a 900ms grace period to retain player tracking through rapid motion or brief camera occlusion.

---

## 🔒 Privacy & Local Execution

- **0 Remote API Calls**: Frame processing occurs inside client JavaScript/WASM.
- **0 Video Storage**: No video frames or images are recorded or saved to storage.
- **0 Facial Recognition**: Tracking relies exclusively on anonymous 3D skeleton keypoints.
