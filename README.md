# 🎮 VYBE — Your Camera is the Controller

> **Camera-powered party games where YOU are the controller.**  
> Built for web browsers using React, TypeScript, Tailwind CSS, and MediaPipe computer vision.

---

## 🌟 Overview

**VYBE** turns your webcam into a full-body motion controller. Play motion party games locally in your browser with **zero external hardware**, **zero latency**, and **100% local privacy**.

Whether you want to challenge yourself in **Single Player mode** or compete against a friend in **Two Player head-to-head mode**, VYBE tracks 33 3D body pose landmarks in real time to rate your accuracy, speed, and reactions.

---

## ✨ Features

- 📸 **Camera-Powered Control**: Uses your webcam to track body movements at 60 FPS.
- 🧘 **Copy Cat Game**: Match computer reference poses or mirror your friend's moves in real time using 3D vector Cosine Similarity scoring.
- 🧊 **Ice Breaker Game**: Fast-paced reaction challenges (hand raises, head touches, squats, arm waves) calibrated against your standing baseline.
- 👤 **Single & Two Player Modes**: Play solo to beat your Personal Best (saved in `localStorage`) or battle head-to-head in two-player mode.
- 🎵 **Web Audio API Sound Engine**: Zero-asset, synthesized retro sound effects for countdowns, GO! chimes, success fanfares, and match victories.
- 🔒 **100% Local & Private**: All computer vision inference runs in your browser. No video frames are ever uploaded or sent to any server.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Webcam**: Built-in or external USB webcam

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/samriddhichauhan/camgame.git
cd camgame

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open `http://localhost:5173/` in your browser to play!

### Production Build

```bash
# Type-check TypeScript code
npx tsc --noEmit

# Build production bundle
npm run build
```

---

## 🏗️ Computer Vision Architecture

VYBE uses Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision`) to extract 33 3D body landmarks at 60 FPS:

```
Camera Stream (WebRTC)
   │
   ▼
PersonDetector (MediaPipe Pose & Hand Landmarkers)
   │
   ▼
PersonPoseEstimator (Extracts 33 normalized 3D keypoints & confidence scores)
   │
   ▼
PlayerTracker (Spatial left-to-right sorting & playerIndex assignment)
   │
   ▼
VisionEngine (Singleton event emitter running on requestAnimationFrame)
   │
   ▼
Game UI & Landmark Overlays (DetectedPlayerOverlay.tsx)
```

---

## 🕹️ Game Modes & Mechanics

### 1. Copy Cat 🪞
- **Single Player**: Match 5 random computer poses (*Super Hero*, *Star Jump*, *Flamingo Balance*, *Disco Fever*).
- **Two Players**: 3-round role swap battle. Player 1 holds a pose, Player 2 copies it, then roles swap!
- **Scoring**: Calculates Cosine Similarity between joint vectors (shoulders, elbows, wrists, hips, knees, ankles).

### 2. Ice Breaker 🧊
- **Baseline Calibration**: During the 3-second countdown, VYBE measures torso height and shoulder position.
- **Gesture Challenges**:
  - *Raise Left / Right / Both Hands*
  - *Touch Head with Both Hands*
  - *Crouch / Squat*
  - *Wave Both Arms*
- **Scoring**: Up to 100 points per round based on reaction time speed.

---

## 📁 Repository Sitemap

```
src/
├── camera/                  # WebRTC camera stream handlers
├── components/              # Reusable UI components & canvas overlays
├── context/                 # Game session state (GameMode, Player names, Avatars)
├── game-data/               # Game definitions & metadata
├── games/
│   ├── CopyCat/             # Copy Cat game loop & Cosine Similarity scoring
│   └── IceBreaker/          # Ice Breaker gesture detectors & reaction timers
├── screens/                 # Application screens (Home, Mode, Players, Games, Camera)
├── utils/                   # Personal Best storage & Web Audio API synthesizer
└── vision/                  # Shared vision engine & player tracking pipeline
```

---

## 📄 License

MIT © 2026 VYBE Team
