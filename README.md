# Mapplify

Collaborative trip coordination with live location sharing, smart routing, and voice-powered navigation for groups.

## Features

- **Live Location Sharing** — Real-time GPS tracking via WebSockets (STOMP + SockJS)
- **Smart Routing** — Turn-by-turn navigation with automatic route recalculation
- **Voice Commands** — Voice broadcast to room, nearby place search via speech
- **Room System** — Create/join rooms, share destinations with your travel party
- **Safety Alerts** — SOS system with inactivity detection and wellbeing checks
- **Trip History** — Persistent trip and SOS event logging

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 · Vite · Tailwind CSS v4 · Framer Motion |
| Maps | Google Maps JavaScript API (`@vis.gl/react-google-maps`) |
| Backend | Spring Boot 3.5 · Java 17 · Maven |
| Real-time | WebSocket (STOMP + SockJS) |
| Database | MySQL (production) · H2 in-memory (dev) |
| AI/Voice | Groq API (transcription + LLM) · Google TTS |

## Project Structure

```
mapplify/
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── pages/              # Page-level route components
│   │   ├── components/
│   │   │   ├── common/         # Shared UI (theme toggler, animations)
│   │   │   └── map/            # Map-specific UI (sidebar, search, etc.)
│   │   ├── services/           # API client modules
│   │   └── utils/              # Utility functions
│   └── .env.example
├── mapplifybackend/            # Spring Boot API
│   ├── src/main/java/com/mapplify/
│   │   ├── config/             # CORS, WebSocket, security config
│   │   ├── controller/         # REST + WebSocket controllers
│   │   ├── model/              # JPA entities + domain models
│   │   ├── repository/         # Spring Data JPA repositories
│   │   ├── service/            # Business logic
│   │   └── listener/           # WebSocket event listeners
│   └── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- Java 17+
- Maven 3.9+
- MySQL 8+ (or use the dev profile for H2 in-memory)

### Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit .env with your Google Maps API key
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

### Backend Setup

```bash
cd mapplifybackend
cp .env.example .env
# Edit .env with your API keys and DB credentials
```

**Option A — With MySQL:**
```bash
# Ensure MySQL is running and the database exists
./mvnw spring-boot:run
```

**Option B — With H2 (no MySQL needed):**
```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Backend runs on `http://localhost:8081`.

### Environment Variables

#### Frontend (`.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GOOGLE_MAPS_API_KEY` | Yes | Google Maps JavaScript API key |
| `VITE_API_BASE_URL` | No | Backend URL (default: `http://localhost:8081`) |
| `VITE_GOOGLE_MAP_ID` | No | Google Maps Map ID (default: `DEMO_MAP_ID`) |

#### Backend (environment or `.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_MAPS_SERVER_API_KEY` | Yes | Google Maps server-side API key |
| `GROQ_API_KEY` | Yes | Groq API key for voice transcription + LLM |
| `MAPPLIFY_DB_URL` | No | JDBC URL (default: `jdbc:mysql://localhost:3306/mapplify`) |
| `MAPPLIFY_DB_USER` | No | DB username (default: `root`) |
| `MAPPLIFY_DB_PASSWORD` | No | DB password |

## Deployment

### Vercel (Frontend)
1. Connect your GitHub repo to Vercel
2. Set **Root Directory** to `frontend`
3. Framework preset: **Vite**
4. Add environment variables:
   - `VITE_GOOGLE_MAPS_API_KEY` = your Google Maps JS API key
   - `VITE_API_BASE_URL` = your Railway backend URL (e.g. `https://mapplify-backend-production.up.railway.app`)

### Railway (Backend + MySQL)
1. Create a new project on Railway
2. Click **+ New** → **Database** → **MySQL** (this gives you a free MySQL instance)
3. Railway auto-sets: `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD`
4. Click **+ New** → **GitHub Repo** → select your repo
5. In the service settings, set **Root Directory** to `mapplifybackend`
6. Add these environment variables in the backend service:
   - `GOOGLE_MAPS_SERVER_API_KEY` = your Google Maps server API key
   - `GROQ_API_KEY` = your Groq API key
   - `ALLOWED_ORIGINS` = your Vercel frontend URL (e.g. `https://mapplify.vercel.app`)
7. Railway will auto-detect Maven, build the JAR, and start it
8. Reference the MySQL service variables in your backend service (Railway does this automatically when both are in the same project)

