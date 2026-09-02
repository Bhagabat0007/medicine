# MediKiosk — Backend Development Specification

## 1. Project Overview

MediKiosk is an AI-powered clinical history and intake management system.

The backend is responsible for connecting the patient's kiosk experience with:

- AI conversation engine
- Speech-to-text input
- Clinical history extraction
- Medical document OCR
- Clinical summary generation
- Red-flag detection
- Patient/session management
- Consent management
- Doctor dashboard
- ABDM/FHIR integration
- Data deletion and privacy controls

The core backend pipeline is:

```text
Patient
   ↓
Frontend Kiosk
   ↓
Backend API
   ↓
Session Manager
   ↓
AI / OCR / Rules Engine
   ↓
Structured Clinical Data
   ↓
Doctor Summary
   ↓
Doctor Dashboard
   ↓
HIS / ABDM / FHIR
```

---

# 2. Recommended Backend Stack

## Core Backend

Recommended:

```text
Python
FastAPI
Pydantic
Uvicorn
```

Alternative:

```text
Node.js
Express / NestJS
TypeScript
```

### Recommended choice for this hackathon

**FastAPI + Python**

Reason:

- Easy API development
- Excellent for AI/LLM integration
- Pydantic validation
- Async support
- Easy integration with OCR/ML libraries
- Fast to prototype

---

# 3. Database

Use:

```text
PostgreSQL
```

Recommended ORM:

```text
SQLAlchemy
```

or:

```text
SQLModel
```

For the hackathon, SQLModel can make the code simpler.

---

# 4. Backend Responsibilities

The backend should handle the following modules.

```text
A. Patient Session Management
B. Conversational History Engine
C. Clinical Data Extraction
D. Red-Flag Detection
E. Document Upload + OCR
F. Clinical Summary Generator
G. Doctor Review
H. Consent Management
I. ABDM/FHIR Integration
J. Data Cleanup
```

The original project defines four primary modules — conversational history, document digitization, summary generation, and consent/ABDM integration — with red-flag detection as a cross-cutting feature.

---

# 5. High-Level Architecture

```text
                         ┌─────────────────┐
                         │   React/Next.js │
                         │     Frontend    │
                         └────────┬────────┘
                                  │
                              REST API
                                  │
                         ┌────────▼────────┐
                         │    FastAPI      │
                         │    Backend      │
                         └────────┬────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             │                    │                    │
             ▼                    ▼                    ▼
      Session Service       AI Service            OCR Service
             │                    │                    │
             │                    ▼                    ▼
             │                 LLM API            OCR API
             │
             ▼
        PostgreSQL
             │
             ▼
      Clinical Records
             │
             ▼
       FHIR Adapter
             │
             ▼
       ABDM / HIS
```

---

# 6. Project Structure

Recommended FastAPI structure:

```text
backend/

├── app/
│
│   ├── main.py
│   │
│   ├── api/
│   │   ├── routes/
│   │   │   ├── patients.py
│   │   │   ├── sessions.py
│   │   │   ├── interview.py
│   │   │   ├── documents.py
│   │   │   ├── summary.py
│   │   │   ├── doctor.py
│   │   │   ├── consent.py
│   │   │   └── integration.py
│   │   │
│   │   └── router.py
│   │
│   ├── services/
│   │   ├── interview_service.py
│   │   ├── llm_service.py
│   │   ├── ocr_service.py
│   │   ├── summary_service.py
│   │   ├── redflag_service.py
│   │   ├── consent_service.py
│   │   └── fhir_service.py
│   │
│   ├── models/
│   │   ├── patient.py
│   │   ├── session.py
│   │   ├── conversation.py
│   │   ├── document.py
│   │   ├── summary.py
│   │   └── consent.py
│   │
│   ├── schemas/
│   │   ├── patient.py
│   │   ├── interview.py
│   │   ├── document.py
│   │   ├── summary.py
│   │   └── consent.py
│   │
│   ├── db/
│   │   ├── database.py
│   │   └── migrations/
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── logging.py
│   │
│   └── prompts/
│       ├── interview_prompt.py
│       └── summary_prompt.py
│
├── tests/
│
├── .env
├── requirements.txt
├── Dockerfile
└── README.md
```

---

# 7. Main Database Entities

For the hackathon MVP, use these tables.

```text
patients
sessions
consents
conversation_messages
clinical_data
documents
summaries
red_flags
integration_events
```

---

# 8. Patient Table

Example:

```text
patients

id
name
age
gender
abha_id
created_at
updated_at
```

For the hackathon, ABHA can be represented as a mock identifier.

Do not store unnecessary personal information.

---

# 9. Session Table

A session represents one hospital visit/intake process.

```text
sessions

id
patient_id
language
status
consent_id
started_at
completed_at
expires_at
priority
```

Possible status:

```text
CREATED
CONSENT_PENDING
IN_PROGRESS
DOCUMENT_PROCESSING
SUMMARY_READY
DOCTOR_REVIEW
COMPLETED
EXPIRED
```

Priority:

```text
NORMAL
URGENT
```

---

# 10. Conversation Table

Store the conversation in structured form.

```text
conversation_messages

id
session_id
role
message
question_id
timestamp
metadata
```

Role:

```text
PATIENT
AI
SYSTEM
```

Example:

```json
{
  "role": "PATIENT",
  "message": "I have had chest pain since yesterday.",
  "timestamp": "2026-09-02T10:20:00Z"
}
```

---

# 11. Clinical Data

Do not rely only on raw chat history.

Convert the conversation into structured clinical information.

Example:

```json
{
  "chief_complaint": "Chest pain",
  "onset": "Yesterday",
  "severity": 7,
  "character": "Pressure",
  "associated_symptoms": [
    "Breathlessness"
  ],
  "duration": "1 day"
}
```

This structured data is what the summary engine should use.

---

# 12. Interview Engine

The interview engine is the heart of the backend.

The original specification describes an SOCRATES-style adaptive interview where follow-up questions branch based on the patient's chief complaint.

Basic flow:

```text
Patient answer
      ↓
Extract information
      ↓
Determine missing information
      ↓
Check red flags
      ↓
Generate next question
      ↓
Return question to frontend
```

---

# 13. Interview API

### Start Interview

```http
POST /api/v1/sessions/{session_id}/interview/start
```

Response:

```json
{
  "question_id": "chief_complaint",
  "type": "voice_text",
  "text": "What brings you here today?"
}
```

---

# 14. Submit Answer

```http
POST /api/v1/sessions/{session_id}/interview/answer
```

Request:

```json
{
  "question_id": "chief_complaint",
  "answer": "I have chest pain.",
  "input_type": "voice"
}
```

Response:

```json
{
  "next_question": {
    "question_id": "pain_onset",
    "type": "single_choice",
    "text": "When did the pain start?"
  },
  "progress": 25,
  "priority": "normal"
}
```

---

# 15. AI Dialogue Manager

The AI should NOT behave like a general-purpose chatbot.

It should operate within a strict clinical-history structure.

The project specifically proposes an LLM dialogue manager combined with a defined clinical-history prompt/ontology rather than unrestricted conversation.

The AI should:

```text
✓ Ask relevant questions
✓ Extract symptoms
✓ Identify missing information
✓ Follow structured history
✓ Detect possible red flags
✓ Produce structured data
```

The AI should NOT:

```text
✗ Diagnose the patient
✗ Prescribe medication
✗ Recommend treatment
✗ Override the doctor
✗ Invent medical information
```

---

# 16. LLM Output Schema

Never directly trust free-form LLM output.

Force structured JSON.

Example:

```json
{
  "extracted_data": {
    "chief_complaint": "Chest pain",
    "onset": "Yesterday",
    "severity": 7
  },
  "missing_fields": [
    "radiation",
    "aggravating_factors"
  ],
  "red_flag": true,
  "next_question": {
    "id": "breathlessness",
    "text": "Are you having difficulty breathing?"
  }
}
```

Validate the response with Pydantic.

---

# 17. Red-Flag Detection

This should be implemented independently from the summary generator.

Example:

```text
Patient answer
     ↓
Red Flag Engine
     ↓
Rules + AI classifier
     ↓
NORMAL / URGENT
```

The original project gives examples such as chest pain with breathlessness and stroke signs, where the normal queue should be bypassed and triage staff alerted.

---

# 18. Simple Hackathon Red-Flag Engine

Start with deterministic rules.

Example:

```python
RED_FLAG_PATTERNS = [
    ["chest pain", "breathlessness"],
    ["difficulty breathing", "chest pain"],
    ["face drooping"],
    ["speech difficulty"],
    ["sudden weakness"],
]
```

If detected:

```json
{
  "priority": "URGENT",
  "alert_triage": true
}
```

This is safer and easier to demonstrate than relying entirely on an LLM.

---

# 19. Red-Flag API

```http
GET /api/v1/sessions/{session_id}/priority
```

Response:

```json
{
  "priority": "URGENT",
  "reason": "Potential emergency symptom pattern",
  "triage_alert": true
}
```

Do not expose a diagnosis to the patient.

---

# 20. Document Upload

Endpoint:

```http
POST /api/v1/sessions/{session_id}/documents
```

Accept:

```text
jpg
jpeg
png
pdf
```

Pipeline:

```text
Upload
  ↓
File validation
  ↓
OCR
  ↓
Text extraction
  ↓
Medical entity extraction
  ↓
Structured document
  ↓
Save result
```

---

# 21. OCR Result

Example:

```json
{
  "document_type": "prescription",
  "date": "2026-08-12",
  "medicines": [
    {
      "name": "Medicine A",
      "dosage": "500mg"
    }
  ],
  "diagnoses": [],
  "lab_values": []
}
```

The project suggests Google Vision, Tesseract, or Azure Document Intelligence as possible OCR technologies.

---

# 22. Medical Timeline

If multiple documents are uploaded:

```text
2024
│
├── Prescription
│
2025
│
├── Lab Report
│
2026
│
├── Discharge Summary
└── Current Prescription
```

The backend should normalize document dates where possible.

For the hackathon, this can be represented as a simple sorted array.

---

# 23. Summary Generator

Endpoint:

```http
POST /api/v1/sessions/{session_id}/summary
```

Input:

```text
Conversation
+
Structured clinical data
+
OCR results
```

Output:

```text
CC
HPI
PMH
Drug History
Allergies
FH
PH
ROS
```

The project's proposed summary structure is explicitly:

**CC → HPI → PMH → Drug/Allergy → FH → PH → ROS**.

---

# 24. Summary JSON

Example:

```json
{
  "chief_complaint": {
    "text": "Chest pain for 1 day"
  },

  "hpi": {
    "onset": "Yesterday",
    "severity": 7,
    "character": "Pressure",
    "associated_symptoms": [
      "Breathlessness"
    ]
  },

  "past_medical_history": [],

  "medications": [
    {
      "name": "Medicine A"
    }
  ],

  "allergies": [],

  "family_history": [],

  "personal_history": {},

  "review_of_systems": {}
}
```

---

# 25. AI Safety

This is extremely important for the project.

The backend must treat the generated summary as:

```text
AI-GENERATED DRAFT
```

not:

```text
AI DIAGNOSIS
```

The doctor must be able to:

```text
Review
Edit
Confirm
```

before the information is finalized.

This safety framing is part of the project's stated clinical-AI approach.

---

# 26. Doctor API

### Get Patient Queue

```http
GET /api/v1/doctor/queue
```

Response:

```json
[
  {
    "token": "A104",
    "patient_name": "Rajesh Kumar",
    "age": 54,
    "priority": "URGENT",
    "status": "SUMMARY_READY"
  }
]
```

---

# 27. Get Patient Summary

```http
GET /api/v1/doctor/patients/{patient_id}/summary
```

Response:

```json
{
  "patient": {},
  "summary": {},
  "documents": [],
  "priority": "NORMAL"
}
```

---

# 28. Edit Summary

```http
PATCH /api/v1/doctor/patients/{patient_id}/summary
```

Request:

```json
{
  "chief_complaint": "Chest pain for 2 days",
  "hpi": {
    "severity": 6
  }
}
```

---

# 29. Confirm Summary

```http
POST /api/v1/doctor/patients/{patient_id}/summary/confirm
```

Response:

```json
{
  "status": "CONFIRMED",
  "message": "Clinical summary confirmed."
}
```

---

# 30. Consent Management

Endpoints:

```text
POST /api/v1/sessions/{id}/consent
GET  /api/v1/sessions/{id}/consent
```

Consent record:

```json
{
  "session_id": "abc123",
  "consent_given": true,
  "purpose": "Clinical history and hospital consultation",
  "timestamp": "2026-09-02T10:00:00Z"
}
```

The original design calls for granular consent and a DPDP-aware consent layer.

---

# 31. Data Auto-Purge

The backend should have a cleanup job.

Example:

```text
Session completed
       ↓
FHIR/HIS submission
       ↓
Session marked COMPLETED
       ↓
Temporary data scheduled for deletion
       ↓
Cleanup worker
       ↓
Delete temporary files/session data
```

For the hackathon, implement this as a background task or scheduled job.

---

# 32. FHIR / ABDM Integration

Create an abstraction:

```python
class FHIRService:
    async def push_patient(self):
        ...

    async def push_observation(self):
        ...

    async def push_document(self):
        ...

    async def push_encounter(self):
        ...
```

This allows you to use:

```text
MockFHIRService
```

during the hackathon and later replace it with:

```text
ABDMFHIRService
```

The project explicitly proposes ABDM FHIR APIs and notes that a simulated `"Pushed to HIS ✅"` API call is acceptable as a hackathon stretch goal.

---

# 33. Mock FHIR Endpoint

For the demo:

```http
POST /api/v1/integration/fhir/push
```

Response:

```json
{
  "status": "success",
  "destination": "HIS",
  "resource_type": "ClinicalDocument",
  "mock": true
}
```

Frontend displays:

```text
✓ Clinical summary created
✓ HIS updated
✓ ABHA record updated
```

Clearly label simulated integrations as demo/mock functionality.

---

# 34. API List

Minimum backend API:

```text
PATIENT
POST   /patients
GET    /patients/{id}

SESSION
POST   /sessions
GET    /sessions/{id}

CONSENT
POST   /sessions/{id}/consent

INTERVIEW
POST   /sessions/{id}/interview/start
POST   /sessions/{id}/interview/answer
GET    /sessions/{id}/interview

DOCUMENTS
POST   /sessions/{id}/documents
GET    /sessions/{id}/documents

SUMMARY
POST   /sessions/{id}/summary
GET    /sessions/{id}/summary

RED FLAGS
GET    /sessions/{id}/priority

DOCTOR
GET    /doctor/queue
GET    /doctor/patients/{id}/summary
PATCH  /doctor/patients/{id}/summary
POST   /doctor/patients/{id}/summary/confirm

INTEGRATION
POST   /integration/fhir/push
```

---

# 35. Environment Variables

Create:

```text
.env
```

Example:

```text
DATABASE_URL=

LLM_API_KEY=

OCR_API_KEY=

FHIR_BASE_URL=
FHIR_CLIENT_ID=
FHIR_CLIENT_SECRET=

APP_ENV=development

SESSION_EXPIRY_MINUTES=60
```

Never commit `.env`.

Add:

```text
.env
```

to `.gitignore`.

---

# 36. API Response Format

Use a consistent format.

Success:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Error:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_SESSION",
    "message": "Session is no longer active."
  }
}
```

---

# 37. Error Handling

Common errors:

```text
INVALID_SESSION
SESSION_EXPIRED
CONSENT_REQUIRED
INVALID_INPUT
LLM_ERROR
OCR_ERROR
DOCUMENT_TOO_LARGE
UNSUPPORTED_FILE
SUMMARY_GENERATION_FAILED
FHIR_ERROR
```

Never expose internal stack traces to the frontend.

---

# 38. Security

Minimum hackathon requirements:

```text
✓ Environment variables for secrets
✓ Input validation
✓ File type validation
✓ File size limits
✓ Session expiration
✓ Consent verification
✓ No API keys in frontend
✓ HTTPS in production
✓ Logging without sensitive data
```

Do not log:

```text
Patient medical history
ABHA identifiers
Uploaded document contents
LLM prompts containing patient data
```

unless there is a specific secure reason.

---

# 39. AI Prompt Architecture

Keep prompts separate from business logic.

```text
prompts/

├── interview_system.txt
├── extraction_system.txt
├── redflag_system.txt
└── summary_system.txt
```

Example interview instructions:

```text
You are MediKiosk's clinical history intake assistant.

Your purpose is to collect structured clinical history.

Rules:

1. Ask one question at a time.
2. Use simple language.
3. Do not diagnose.
4. Do not prescribe.
5. Do not invent patient information.
6. Follow the required clinical history structure.
7. Identify missing information.
8. Flag potential emergency patterns.
9. Return structured JSON.
```

---

# 40. AI Reliability

Use a pipeline rather than trusting one LLM response.

```text
User answer
     ↓
LLM extraction
     ↓
Pydantic validation
     ↓
Rule validation
     ↓
Clinical state update
     ↓
Red-flag check
     ↓
Next question
```

If LLM output is invalid:

```text
LLM
 ↓
Invalid JSON
 ↓
Retry / repair
 ↓
If still invalid
 ↓
Fallback question
```

---

# 41. Session State Machine

Use a state machine.

```text
CREATED
   ↓
CONSENT_PENDING
   ↓
IN_PROGRESS
   ↓
DOCUMENT_PROCESSING
   ↓
SUMMARY_READY
   ↓
DOCTOR_REVIEW
   ↓
COMPLETED
```

Emergency:

```text
IN_PROGRESS
      ↓
RED_FLAG_DETECTED
      ↓
URGENT_TRIAGE
```

---

# 42. Testing

At minimum create tests for:

### Session

```text
✓ Create session
✓ Expire session
✓ Invalid session
```

### Interview

```text
✓ Start interview
✓ Submit answer
✓ Generate next question
✓ Invalid answer
```

### Red Flags

```text
✓ Chest pain + breathlessness → URGENT
✓ Normal symptom → NORMAL
```

### Documents

```text
✓ Upload valid image
✓ Reject unsupported file
✓ OCR response
```

### Summary

```text
✓ Generate summary
✓ Validate summary schema
✓ Doctor edits summary
```

---

# 43. Demo Seed Data

Create one sample patient.

```json
{
  "name": "Rajesh Kumar",
  "age": 54,
  "token": "A104"
}
```

Sample scenario:

```text
Chief complaint:
Chest pain

Duration:
1 day

Severity:
7/10

Associated:
Breathlessness
```

This gives the demo a clear path through:

```text
Patient
 ↓
AI interview
 ↓
Red flag
 ↓
Doctor queue
 ↓
Clinical summary
```

---

# 44. Backend MVP Priority

## P0 — Must Build

```text
✓ FastAPI server
✓ PostgreSQL
✓ Patient/session APIs
✓ Consent API
✓ Interview API
✓ LLM integration
✓ Structured clinical data
✓ Summary generation
✓ Doctor summary API
✓ Red-flag rules
```

## P1 — Stretch

```text
✓ OCR
✓ Document storage
✓ Medical timeline
✓ Mock FHIR API
✓ Auto-purge worker
```

## P2 — Production Extensions

```text
✓ Real ABDM integration
✓ Real Bhashini/AI4Bharat ASR
✓ Production authentication
✓ Audit logging
✓ Advanced medical NER
✓ Drug interaction engine
✓ Distributed job queue
```

The project itself identifies OCR, mock ABDM/FHIR push, and red-flag detection as stretch goals around the core interview + summary MVP.

---

# 45. Backend Demo Sequence

The backend should support this complete flow:

```text
1. POST /sessions
             ↓
2. POST /consent
             ↓
3. POST /interview/start
             ↓
4. POST /interview/answer
             ↓
5. AI extracts clinical information
             ↓
6. Red-flag engine checks symptoms
             ↓
7. AI generates next question
             ↓
8. Repeat
             ↓
9. Upload prescription
             ↓
10. OCR extracts information
             ↓
11. Generate clinical summary
             ↓
12. Doctor retrieves summary
             ↓
13. Doctor edits
             ↓
14. Doctor confirms
             ↓
15. Mock FHIR push
             ↓
16. Session completed
             ↓
17. Temporary data cleanup
```

---

# 46. Definition of Done

The backend is considered ready for the hackathon when the frontend can perform this entire operation through APIs:

```text
Create patient
       ↓
Create session
       ↓
Record consent
       ↓
Start interview
       ↓
Send patient answers
       ↓
Receive adaptive questions
       ↓
Detect potential red flags
       ↓
Upload sample document
       ↓
Extract document information
       ↓
Generate clinical summary
       ↓
Doctor retrieves summary
       ↓
Doctor edits summary
       ↓
Doctor confirms
       ↓
Mock FHIR/HIS submission
       ↓
Complete session
```

---

# 47. Most Important Backend Principle

Do not try to build an entire hospital backend during the hackathon.

Build one excellent pipeline:

```text
VOICE / TEXT
     ↓
PATIENT ANSWER
     ↓
STRUCTURED CLINICAL DATA
     ↓
RED-FLAG CHECK
     ↓
ADAPTIVE QUESTION
     ↓
CLINICAL SUMMARY
     ↓
DOCTOR REVIEW
```

If this works reliably, **MediKiosk already has a strong hackathon MVP**.

The frontend provides the patient experience.

The backend provides the intelligence.

The doctor dashboard demonstrates the impact.

> **Patient speaks → MediKiosk structures → Doctor decides.**

---

# 48. Production-Readiness Upgrades (Implemented)

This section records the upgrades made to move the backend from a purely
in-memory, unauthenticated hackathon MVP toward a real, secure, durable
service. It addresses the earlier review gaps: **no auth, no persistence,
simulated AI, and no navigation entry point**.

## 48.1 Doctor Authentication (JWT)

Previously the `/doctor/*` and `/integration/*` endpoints were entirely open.
Any visitor could open the dashboard by typing the URL. This is now fixed.

- **Login endpoint** — `POST /api/v1/auth/login` (`backend/src/api/routes/auth.ts`)
  accepts `{ username, password }`, verifies against the seeded doctor account
  and issues a signed JWT.
- **Session endpoint** — `GET /api/v1/auth/me` returns the current doctor
  profile for an authenticated (Bearer) request.
- **Auth middleware** — `backend/src/api/middleware/auth.ts` (`requireAuth`)
  validates the `Authorization: Bearer <token>` header and attaches the
  verified payload to `req.auth`.
- **Protected routes** — `backend/src/api/router.ts` now applies `requireAuth`
  to the entire `/doctor` and `/integration` router mounts.
- **Seeded credentials** — default `admin` / `doctor123`, overridable via
  `DOCTOR_USERNAME` and `DOCTOR_PASSWORD` env vars. Passwords are verified
  against a bcrypt hash, and the JWT is signed with `JWT_SECRET`
  (`backend/src/services/auth_service.ts`).

## 48.2 Persistence (JSON File Store)

The original MVP used an in-memory `Map` store that reset on every restart.
It now persists to disk so data survives server restarts.

- **File location** — `<backend>/data/medikiosk-db.json` (`DATA_DIR` env).
- **Automatic writes** — `backend/src/db/database.ts` uses a `PersistingMap`
  subclass that debounce-writes to disk after every mutation, so existing
  `db.sessions.set(...)` calls remain unchanged.
- **Atomic saves** — `backend/src/db/persistence.ts` writes to a temp file then
  renames, avoiding corruption on crash.
- **Test isolation** — persistence is disabled when `NODE_ENV=test` /
  `VITEST=true` so automated tests start from a clean store each run.

## 48.3 Real LLM Integration (when configured)

The interview engine already had an LLM path; the **summary generator** is now
also LLM-driven.

- `backend/src/services/llm_service.ts` adds `generateClinicalSummaryDraft()` —
  it asks an OpenAI/Groq-compatible LLM to produce a structured clinical draft
  (CC → HPI → PMH → meds → allergies → FH → PH → ROS).
- `backend/src/api/routes/summary.ts` now prefers the LLM draft and falls back
  to the deterministic rule-based generator when no `LLM_API_KEY` is set or the
  call fails. The response includes `provider: "llm" | "rules"` for transparency.
- Safety: the LLM prompt explicitly forbids diagnoses and treatment
  recommendations, and the output is always an **AI-generated draft** for the
  doctor to review.

## 48.4 OCR Provider Abstraction

`backend/src/services/ocr_service.ts` now exposes a provider-aware `mode`:

- **Real** — when both `OCR_API_KEY` and `OCR_ENDPOINT` are set, it calls a
  Document-Intelligence-compatible REST endpoint to extract fields.
- **Simulated** — otherwise it returns the deterministic canned results, so the
  app keeps working offline and in tests.

The route layer (`documents.ts`, `patients.ts`) is unchanged.

## 48.5 New Environment Variables

See `backend/.env.example`:

| Variable | Purpose |
| --- | --- |
| `DATA_DIR` | Directory for the persistent JSON database (default `data`) |
| `DOCTOR_USERNAME` | Seeded doctor username (default `admin`) |
| `DOCTOR_PASSWORD` | Seeded doctor password (default `doctor123`) |
| `JWT_SECRET` | HMAC secret for signing JWT tokens (must be set in prod) |
| `JWT_EXPIRES_IN` | Token lifetime (default `12h`) |
| `OCR_ENDPOINT` | Real OCR endpoint (paired with `OCR_API_KEY`) |

## 48.6 New Dependencies

- `jsonwebtoken` + `@types/jsonwebtoken` — JWT sign/verify
- `bcryptjs` + `@types/bcryptjs` — password hashing

## 48.7 Updated Test Coverage

`backend/tests/api.test.ts` now verifies:

- Unauthenticated `/doctor/queue` returns `401 UNAUTHORISED`.
- A valid login issues a token and grants access to the queue.
- The doctor can still edit + confirm a summary when authenticated.

All 16 tests pass (`npm test`).

## 48.8 Remaining Production Gaps

For a true production deployment the following are still open:

- A real RDBMS (Postgres) instead of the JSON file store.
- Postgres-backed FHIR/ABDM write path (currently mocked).
- Refresh-token rotation, multi-factor auth, and RBAC beyond the single role.
- Audit logging and full HIPAA/DPDP-style safeguards.
- HTTPS + secret management in CI/CD.

## 48.9 Idempotent Demo Seeding

Previously `seedDemoData()` ran unconditionally on every server start. Combined
with the new persistence layer this re-inserted the same demo patients every
restart, so the dashboard accumulated duplicate/identical records
(`backend/src/seed.ts`).

- The seed now runs only when the database has **no patients at all**, and logs
  a skip notice otherwise. This prevents duplication while still guaranteeing a
  non-empty demo on first launch.

## 48.10 System Capabilities Endpoint

A public status endpoint was added so the frontend can honestly report which
subsystems are live vs. simulated (never exposes secrets):

- `GET /api/v1/system/capabilities` (`backend/src/api/routes/system.ts`)
  returns `{ llm, ocr, fhir, persistence, auth, env }` mode flags.
- `FHIRService` now exposes a `mode: 'live' | 'simulated'` getter
  (`backend/src/services/fhir_service.ts`) used by this endpoint.

## 48.11 Root Monorepo Tooling

A root orchestrator `package.json` was added so the whole project can be driven
from one place (`npm run dev`, `npm run build`, `npm test`, `npm run lint`,
`npm run install:all`). It uses `concurrently` + `npm --prefix` and does not
disturb the per-package `node_modules`. A root `.gitignore` and an updated
`README.md` document the layout and commands.

