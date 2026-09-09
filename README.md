# MediKiosk 🏥

AI-Powered Clinical Token Generation System

## Overview

MediKiosk is a smart medical kiosk system that helps patients get consultation tokens by describing their symptoms. The AI automatically analyzes the symptoms and recommends the appropriate specialist doctor.

## Features

### Patient Portal
- Simple form to enter personal details
- Describe symptoms in natural language
- AI analyzes symptoms and recommends specialist
- Generates token with estimated wait time
- Shows priority level (Normal/Urgent)

### Doctor Dashboard
- Secure login for doctors
- View patient queue in real-time
- See AI analysis of patient symptoms
- Update token status (Start Consultation/Complete)
- Priority queue for urgent cases

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** SQLite
- **AI:** Keyword-based symptom analysis

## Quick Start

### 1. Start Backend

```bash
cd medikiosk/backend
npm install
npm start
```

Backend runs on `http://localhost:5000`

### 2. Start Frontend

```bash
cd medikiosk/frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Demo Credentials

**Doctor Login:**
- Email: `rajesh@medikiosk.com`
- Password: `doctor123`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tokens/generate` | Generate new token |
| GET | `/api/tokens/:id` | Get token details |
| POST | `/api/doctors/login` | Doctor login |
| POST | `/api/doctors/register` | Register new doctor |
| GET | `/api/doctor/tokens` | Get doctor's queue |
| PUT | `/api/doctor/tokens/:id` | Update token status |

## Project Structure

```
medikiosk/
├── backend/
│   ├── index.js          # Express server & API routes
│   ├── package.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── PatientPortal.jsx
    │   │   ├── TokenResult.jsx
    │   │   ├── DoctorLogin.jsx
    │   │   └── DoctorDashboard.jsx
    │   ├── App.jsx
    │   └── App.css
    └── package.json
```

## How It Works

1. **Patient enters symptoms** → e.g., "chest pain and shortness of breath"
2. **AI analyzes keywords** → Matches against medical specializations
3. **System recommends specialist** → e.g., Cardiologist
4. **Token generated** → With queue position and estimated wait
5. **Doctor sees patient** → In priority-sorted queue
6. **Doctor updates status** → Start/Complete consultation

## License

MIT
