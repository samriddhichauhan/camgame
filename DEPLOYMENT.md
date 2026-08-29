# 🚀 VYBE — Production Web Deployment & Hosting Guide

This guide covers building, configuring, and deploying **VYBE** to public production web hosting platforms (Vercel, Netlify, Cloudflare Pages, AWS Amplify, GitHub Pages, or self-hosted Nginx).

---

## 🔒 Mandatory Production Requirements

### 1. Secure Context (HTTPS)
Web browsers (Chrome, Edge, Safari, Firefox) **require a secure HTTPS origin** to grant webcam camera access (`navigator.mediaDevices.getUserMedia`). 
- **Production Public Origin**: `https://vybe.game` (or any custom domain with an SSL/TLS certificate).
- **Local Testing**: `http://localhost:5173/` or `http://127.0.0.1:5173/` are treated as secure contexts by default.

---

## 📦 Build & Preview Commands

```bash
# 1. Install dependencies
npm install

# 2. Type-check TypeScript code
npx tsc --noEmit

# 3. Build production bundle
npm run build

# 4. Preview local production bundle
npm run preview
```

The compiled bundle is output to `dist/`:
- `dist/index.html`
- `dist/assets/index-[hash].css`
- `dist/assets/index-[hash].js`

---

## 🌐 SPA Routing & Rewrite Rules

VYBE uses client-side routing (`React Router v7`). When deploying to static web hosts, all non-file route requests (`/mode`, `/players`, `/games`, `/camera`, `/play`, `/privacy`, `/terms`, `/about`, `/contact`) must fall back to `index.html`.

### Vercel (`vercel.json`)
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Netlify (`public/_redirects`)
```
/*    /index.html   200
```

### Cloudflare Pages (`public/_routes.json`)
```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/assets/*"]
}
```

### Nginx Configuration
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## 🤖 Computer Vision Model Asset Delivery

VYBE uses Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision` v1.0.1). Model binaries (`.tflite` and `.task`) are loaded asynchronously over HTTPS from Google's official Google Cloud Storage & jsDelivr WASM CDNs:

- **Fileset Resolver WASM**: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm`
- **Person Object Detector**: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`
- **Pose Landmarker**: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`

### Performance & Caching Benefits:
- Models are cached in browser HTTP cache / IndexedDB after initial load.
- No bulky ML model binaries are packed inside the Vite production JS bundle.

---

## 🔐 Privacy & Security Audit

- **100% Local Inference**: Camera feeds are decoded inside HTML5 Video/Canvas elements and processed on-device.
- **Zero Video Uploads**: Video frames are **never** recorded, stored, or transmitted to any server.
- **Zero Facial Recognition**: Pose landmark estimation extracts anonymous 3D joint keypoints only.
- **No Third-Party Tracker Cookies**: VYBE requires no tracking cookies or invasive third-party analytics scripts.

---

## 🛠️ Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **"Camera access is required"** | Browser permission denied or insecure HTTP origin | Ensure site is served over `https://`. Click camera icon in browser address bar to reset permissions. |
| **SPA 404 on page refresh** | Missing SPA rewrite rule | Add `vercel.json` or `_redirects` fallback rule so routes point to `index.html`. |
| **Model loading error** | Network connection blocked CDN domain | Verify firewall allows requests to `cdn.jsdelivr.net` and `storage.googleapis.com`. |
