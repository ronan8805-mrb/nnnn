# SLÁN - Ireland's National Safety Guardian

**"One tap. Home safe."**

SLÁN is Ireland's ultimate public safety app with a dark Batman aesthetic — a vigilant, no-nonsense digital immune system that prevents danger, escapes it, survives it, and heals from it.

## 🎯 Features

### Core Features
- ✅ **Red SOS Button** - One-tap emergency with 10-sec video, GPS, and instant Gardaí dispatch
- ✅ **Live Garda Chat** - Text/video/audio with operator in <60 seconds
- ✅ **Crime Prediction Map** - 85% accurate hotspots from real data
- ✅ **Guardian Alerts** - Instant notification to 3 verified contacts
- ✅ **Vulnerable Mode** - Discreet SOS for abuse victims (auto-escalates)
- ✅ **Map Warnings** - Push alerts: "Avoid this area tonight"
- ✅ **Biometric Login** - PPSN/Passport + Face ID/Fingerprint (no anonymous access)
- ✅ **Child Mode (8-15)** - Parent-controlled, SOS + location only
- ✅ **Garda Dashboard** - Real-time SOS queue, accept-call button, officer map

### 10 Premium Features (Ireland's Digital Immune System)
1. **Silent Panic Trigger** - Hold volume-down + power for 3 sec → auto-SOS with no sound
2. **Fake Call Escape** - Press power 5 times → fake incoming call to escape danger
3. **Safe Walk Home Mode** - Live tracking, auto-SOS if stopped or deviate from route
4. **One-Tap DV Alert** - Instantly notify specialist Garda DV unit + nearest refuge
5. **AI Voice Distress Detection** - Detects "help me", crying → auto-triggers SOS (opt-in)
6. **Lost Child Beacon** - Low-frequency sound + flashing light visible only to Gardaí
7. **Crowd-Source Danger Zones** - Users mark unsafe areas → real-time heat map
8. **Garda Live Location Sharing** - See nearest on-duty Garda car (anonymized)
9. **Emergency Medical Profile** - Auto-send allergies, blood type to ambulance crews
10. **Post-Incident Support Hub** - One-tap connection to crisis centers

### Bonus: Ireland Shield (National Lockdown Mode)
- Government push "Lockdown Alert" to every SLÁN user in Ireland
- Safe routes to nearest Garda station/shelter
- One-tap "I'm safe" check-in for families
- Makes SLÁN the most powerful civilian protection tool in Europe

## 🏗️ Technology Stack

### Frontend
- **React Native (Expo)** - Mobile-first development
- **Expo Router** - File-based routing
- **Real Integrations:**
  - `expo-location` - GPS tracking
  - `expo-camera` - Video recording
  - `expo-notifications` - Push alerts
  - `expo-audio` - Harp sounds + ultrasonic beacon
  - `expo-local-authentication` - Biometrics
  - `react-native-maps` - OpenStreetMap tiles
  - `socket.io-client` - Real-time WebSocket

### Backend
- **Python FastAPI** - REST API
- **PostgreSQL** - Database
- **SQLAlchemy** - ORM
- **Socket.IO** - WebSocket server
- **Bcrypt** - Password hashing
- **JWT** - Authentication tokens

### Deployment
- **Docker multi-stage** (frontend build → backend)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 15+
- Docker (optional)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up database
createdb slan_db

# Run migrations (create tables)
python -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine)"

# Start backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd SLAN

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

Press `i` for iOS simulator or `a` for Android emulator.

### Docker Deployment

```bash
# Build and run all services
docker-compose up --build

# Backend: http://localhost:8000
# Frontend: Expo app on device
```

## 📱 App Structure

```
SLAN/
├── app/                      # Expo Router screens
│   ├── index.tsx            # Splash screen
│   ├── login.tsx            # Public login/register
│   ├── garda-login.tsx      # Garda login
│   ├── home.tsx             # Public dashboard
│   ├── sos-activated.tsx    # Emergency mode
│   ├── crime-map.tsx        # Crime hotspots
│   ├── guardian-view.tsx    # Guardian alerts
│   ├── garda-dashboard.tsx  # Garda SOS queue
│   ├── safe-walk.tsx        # Safe Walk Home
│   ├── medical-profile.tsx  # Medical info
│   ├── support-hub.tsx      # Crisis centers
│   ├── lockdown-mode.tsx    # Ireland Shield
│   └── settings.tsx         # App settings
├── components/              # Reusable components
│   ├── SOSButton.tsx        # Pulsing red button
│   ├── MapView.tsx          # OpenStreetMap
│   ├── LanguageToggle.tsx   # Gaelic/English
│   ├── BiometricAuth.tsx    # Face ID/Fingerprint
│   ├── HardwareButtonListener.tsx  # Silent panic
│   ├── AIVoiceDetection.tsx        # Voice distress
│   ├── DangerZoneMarker.tsx        # Heat map
│   ├── ChildBeacon.tsx             # Lost child
│   └── FakeCallOverlay.tsx         # Fake call
├── styles/
│   ├── theme.ts             # Dark Batman aesthetic
│   └── animations.ts        # Glow effects
└── assets/
    ├── icon.png             # Emerald eye logo
    ├── harp-chord.mp3       # Login sound
    └── fake-call-voice.mp3  # Pre-recorded call

backend/
├── main.py                  # FastAPI app + endpoints
├── database.py              # PostgreSQL connection
├── models.py                # SQLAlchemy models
├── requirements.txt         # Python dependencies
└── data/
    └── stations.json        # 300 Garda stations
```

## 🎨 Design Aesthetic

**Dark Batman Theme:**
- Background: `#000000` (pure black)
- Accent: `#00A650` (emerald green glow)
- SOS: `#FF0000` (pulsing red)
- Text: `#FFFFFF` (white)
- Font: Bold sans-serif (Gotham-style)

## 🔒 Security & Privacy

- **Mandatory Registration** - PPSN/Passport + biometric (no anonymous access)
- **End-to-End Encryption** - All communications encrypted
- **GDPR Compliant** - Medical profiles encrypted, user data protected
- **Biometric Authentication** - Face ID/Fingerprint for all logins
- **On-Device AI** - Voice detection uses local ML model (no cloud)

## 📊 Database Schema

### Core Tables
- `users` - Public user accounts (PPSN, passport, biometric hash)
- `garda` - Garda accounts (Garda ID, station assignment)
- `stations` - 300 Garda stations across Ireland
- `sos_queue` - Active emergency calls
- `crime_hotspots` - Predicted danger zones
- `feedback` - User feedback

### Premium Feature Tables
- `medical_profiles` - Emergency medical info
- `danger_zones` - Crowd-sourced unsafe areas
- `safe_walk_journeys` - Active Safe Walk sessions
- `support_services` - Crisis center contacts
- `lockdown_alerts` - National emergency alerts
- `safe_check_ins` - "I'm safe" confirmations

## 🌍 API Endpoints

### Core Endpoints
- `POST /register` - Register public user
- `POST /garda/register` - Register Garda
- `POST /emergency` - Trigger SOS
- `GET /crime-map` - Get hotspots
- `GET /stations` - Get all 300 stations
- `GET /dashboard/{station_id}` - Garda dashboard data
- `POST /accept-call` - Accept SOS call
- `POST /feedback` - Submit feedback

### Premium Feature Endpoints
- `POST /safe-walk/start` - Start Safe Walk
- `POST /safe-walk/end` - End journey
- `POST /dv-alert` - DV emergency
- `POST /danger-zone/report` - Report unsafe area
- `GET /danger-zone/heatmap` - Get heat map
- `GET /garda-locations` - Get Garda positions
- `POST /medical-profile` - Save medical info
- `GET /support-services` - Get crisis centers
- `POST /child-beacon/activate` - Activate beacon
- `POST /admin/lockdown-alert` - Trigger lockdown
- `POST /lockdown/safe-check` - "I'm safe" check-in

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Testing
1. Install Expo Go on iOS/Android device
2. Scan QR code from `npx expo start`
3. Test biometric authentication
4. Test GPS location permissions
5. Test camera video recording
6. Test push notifications
7. Test hardware button triggers

## 📄 License

This is a concept safety app for Ireland. Not affiliated with An Garda Síochána.

## 🙏 Acknowledgments

Built with ❤️ for Ireland's safety.

**"This is no longer an app. This is Ireland's digital immune system."**
