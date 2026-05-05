# SLÁN - Sovereign Life Assistance Network 🛡️

SLÁN is Ireland's premier emergency response and citizen safety platform, designed for high-authority tactical orchestration between citizens, Garda Headquarters, and first responders.

## 🚀 Deployment Guide (Investor Readiness)

This repository is configured for **Instant Cross-Platform Synchronization**. Whether using a smartphone, a high-performance laptop, or a desktop terminal, all participants are connected in a unified real-time tactical environment.

### 🌐 Web Deployment (Render / Vercel)
The project is optimized for Vercel (Frontend) and Render (Backend).
1. **Push to GitHub**: Already completed.
2. **Connect to Vercel**: Import the repository.
   - Framework: **Expo / Next.js**
   - Build Command: `npm run build:web`
   - Environment Variable: `EXPO_PUBLIC_API_URL` (Point to your deployed backend).

### 📱 Mobile Readiness (Expo Go)
For investors who want to test on their own mobile devices:
1. Install **Expo Go** from the App Store / Play Store.
2. Run `npx expo start` in the project root.
3. Scan the QR code to launch the **SLÁN Tactical Interface** on your phone.

---

## 🛠️ Tactical Demo Features

### 1. Real-Time Emergency Orchestration
- **Citizen Side**: Swipe to activate Garda, Medical, or Fire SOS.
- **Garda Side**: The **Garda Command Center** instantly receives the alert. The **Tactical System Log** flashes with the citizen's ID and live coordinates.
- **Bi-Directional Lifecycle**: Acceptance, Arrival, and Resolution are synchronized instantly across all devices.

### 2. "Jarvis" HUD HUD Redesign
- Military-grade tactical interface.
- Official SLÁN Harp branding watermarks.
- Bold, serious, high-authority typography.
- Live system telemetry overlays.

### 3. Integrated Tactical Map
- Real-time officer tracking.
- Proximity-based danger zone alerts.
- Live evacuation routing.

---

## 🏗️ Tech Stack
- **Frontend**: React Native + Expo Router (Cross-platform Web/iOS/Android)
- **Backend**: FastAPI (Python) + SQLite + Socket.io
- **Real-time**: WebSocket + LocalStorage Cross-Tab Sync (for demo robustness)
- **Design**: Vanilla CSS HUD-style with BlurView and Tactical Animations

---

**SLÁN: Protecting Ireland Together.** 🇮🇪
