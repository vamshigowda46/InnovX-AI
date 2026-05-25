# InnovX AI – Student Collaboration, Startup & Innovation Ecosystem

A production-ready AI-powered platform for student collaboration, startup incubation, and innovation.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, Tailwind CSS, Recharts |
| Backend | Python Flask, Flask-SocketIO, SQLAlchemy |
| Database | MySQL |
| AI | Google Gemini API |
| Maps | **Leaflet + OpenStreetMap** (100% free, no API key) |
| Auth | JWT + Flask-Bcrypt + Google OAuth |
| Real-time | Flask-SocketIO (WebSocket) |

---

## 📁 Project Structure

```
InnovX AI/
├── backend/
│   ├── app/
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routes/         # Flask blueprints (REST APIs)
│   │   ├── middleware/      # JWT auth middleware
│   │   ├── utils/          # AI service, helpers
│   │   └── sockets/        # SocketIO event handlers
│   ├── config.py
│   ├── run.py
│   ├── schema.sql          # MySQL schema
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/          # All page components
    │   ├── components/     # Reusable UI components
    │   ├── context/        # React context (Auth)
    │   └── utils/          # API client, helpers
    ├── package.json
    └── vite.config.js
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- MySQL 8.0+
- Google Gemini API key
- Google Maps API key (optional)

---

### 1. Database Setup

```sql
-- In MySQL:
CREATE DATABASE innovx_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then run the schema:
```bash
mysql -u root -p innovx_db < backend/schema.sql
```

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env file with your credentials:
# - DB_PASSWORD=your_mysql_password
# - GEMINI_API_KEY=your_gemini_api_key
# - GOOGLE_MAPS_API_KEY=your_maps_key
# - MAIL_USERNAME=your_email
# - MAIL_PASSWORD=your_app_password

# Run the server
python run.py
```

Backend runs at: http://localhost:5000

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
# Edit .env file:
# VITE_GOOGLE_MAPS_KEY=your_google_maps_api_key

# Run development server
npm run dev
```

Frontend runs at: http://localhost:5173

---

## 🔑 API Keys Setup

### Google Gemini API
1. Go to https://makersuite.google.com/app/apikey
2. Create an API key
3. Add to `backend/.env`: `GEMINI_API_KEY=your_key`

### Google Maps API
1. Go to https://console.cloud.google.com
2. Enable "Maps JavaScript API"
3. Create credentials → API key
4. Add to `backend/.env`: `GOOGLE_MAPS_API_KEY=your_key`
5. Add to `frontend/.env`: `VITE_GOOGLE_MAPS_KEY=your_key`

### Google OAuth (optional)
1. Go to https://console.cloud.google.com → OAuth 2.0
2. Create credentials
3. Add Client ID and Secret to `backend/.env`

---

## 🎯 Demo Account

After running `schema.sql`, use:
- **Email:** alex@demo.com
- **Password:** Demo@1234

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| POST | /api/auth/verify-otp | Verify email OTP |
| POST | /api/auth/google | Google OAuth |
| GET | /api/users/ | List users |
| GET | /api/users/match-recommendations | AI team matching |
| GET | /api/users/nearby | Nearby collaborators |
| POST | /api/users/analyze-skills | AI skill analysis |
| GET/POST | /api/projects/ | Projects CRUD |
| GET/POST | /api/startups/ | Startups CRUD |
| GET/POST | /api/events/ | Events CRUD |
| GET/POST | /api/mentors/ | Mentors |
| POST | /api/mentors/book-session | Book mentor session |
| GET | /api/messages/conversations | Chat conversations |
| POST | /api/messages/send | Send message |
| POST | /api/ai/generate-ideas | AI project ideas |
| POST | /api/ai/learning-roadmap | AI learning roadmap |
| POST | /api/ai/generate-resume | AI resume builder |
| POST | /api/ai/verify-profile | Profile trust score |
| GET | /api/dashboard/stats | Dashboard statistics |
| GET | /api/dashboard/search | Global search |

---

## 🔌 WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| connect | Client→Server | Authenticate with JWT |
| send_message | Client→Server | Send a message |
| new_message | Server→Client | Receive a message |
| join_room | Client→Server | Join a chat room |
| typing | Client→Server | Typing indicator |
| notification | Server→Client | Real-time notification |

---

## 🛡️ Security Features

- JWT access + refresh tokens
- Password hashing with bcrypt
- SQL injection prevention (SQLAlchemy ORM)
- XSS protection (input sanitization)
- Rate limiting (Flask-Limiter)
- CORS protection
- OTP email verification

---

## 🚀 Production Deployment

### Backend (Gunicorn + Nginx)
```bash
pip install gunicorn
gunicorn -w 4 -k eventlet -b 0.0.0.0:5000 run:app
```

### Frontend (Build)
```bash
npm run build
# Serve dist/ with Nginx or Vercel
```

### Environment Variables (Production)
```env
FLASK_ENV=production
SECRET_KEY=<strong-random-key>
JWT_SECRET_KEY=<strong-random-key>
DATABASE_URL=mysql+pymysql://user:pass@host:3306/innovx_db
GEMINI_API_KEY=<your-key>
GOOGLE_MAPS_API_KEY=<your-key>
FRONTEND_URL=https://your-domain.com
```

---

## ✨ Features

1. **Smart Student Profiles** – Skills, projects, GitHub/LinkedIn, achievements
2. **AI Team Matching** – Gemini-powered compatibility scoring
3. **AI Project Idea Generator** – Domain + difficulty + tech stack
4. **Startup Incubation Hub** – Post startups, find co-founders
5. **AI Skill Analyzer** – Internship & hackathon recommendations
6. **Project Workspace** – Kanban board, tasks, milestones
7. **Hackathon & Event Hub** – Discover and register for events
8. **Real-Time Chat** – WebSocket messaging with typing indicators
9. **Innovation Dashboard** – Analytics, leaderboard, trends
10. **AI Resume Builder** – Professional content generation
11. **Mentor Connect** – Book sessions, ratings, reviews
12. **Nearby Collaborators** – Google Maps location-based search
13. **Reputation System** – Points, badges, ranks
14. **AI Learning Roadmap** – Career path generation
15. **Smart Search** – Global search across all entities
16. **Profile Verification** – AI trust score system

---

## 📄 License

MIT License – Built for the InnovX AI Innovation Ecosystem
