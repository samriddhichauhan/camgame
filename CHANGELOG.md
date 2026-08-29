# 📜 CHANGELOG — VYBE Platform Releases

All notable changes to the VYBE camera-powered motion gaming application are documented in this file.

---

## [v1.0.0] - 2026-08-29 • Production Web Release

### 🎮 Games
- **Copy Cat (`01`)**: 3D Cosine Similarity vector pose matching for Single Player & Two Player role-swap battles.
- **Ice Breaker (`02`)**: Physical 3D arcade ice-smashing game with real-time virtual fist tracking, velocity punch collision, explosion particles, and combo multipliers.
- **Reaction Rush (`03`)**: Rapid motion speed racing game measuring millisecond reaction times across 8 physical prompts.

### ⚙️ Engine & Architecture
- **MediaPipe Tasks Vision**: Real-time 33 3D body landmarking running 100% locally in WASM/WebGL.
- **Position-Aware Tracking**: Spatial left-to-right sorting with 900ms temporal grace period to prevent player index swapping.
- **Web Audio API Synthesizer**: Zero-asset retro sound effects for countdowns, GO! chimes, punch impacts, and victory fanfares.

### 🌐 Web & Production
- Added production SPA router fallback configurations for Vercel, Netlify, and Cloudflare Pages in `DEPLOYMENT.md`.
- Public privacy pages (`/privacy`, `/terms`, `/about`, `/contact`).
- Web App Manifest (`public/manifest.json`) and SEO metadata.
