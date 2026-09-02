# MediKiosk — Frontend Development Specification

## 1. Project Overview

**MediKiosk** is an AI-powered clinical history and intake system designed for use in government hospital OPDs.

The frontend must provide a **simple self-service kiosk experience** where patients can:

1. Identify/register themselves
2. Select their preferred language
3. Give consent
4. Describe their symptoms using voice or touch
5. Answer AI-generated follow-up questions
6. Upload/scan previous medical documents
7. Review their collected information
8. Submit the history
9. Allow the doctor to review a structured clinical summary

The main frontend goal is:

> **Make clinical history-taking possible for elderly, rural, low-literacy and first-time patients without requiring smartphone knowledge.**

---

# 2. Recommended Frontend Stack

### Core

- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**

### UI

- shadcn/ui or custom components
- Lucide React icons
- Large buttons and touch targets
- Responsive design

### Voice

For hackathon MVP:

- Web Speech API — Speech Recognition
- Browser Speech Synthesis / TTS

Production possibility:

- Bhashini / AI4Bharat
- Whisper
- Dedicated Indian-language ASR/TTS

### State Management

Use one of:

- React Context
- Zustand

Recommended for hackathon:

**Zustand**

### API

Use:

```text
Frontend
   ↓
REST API
   ↓
FastAPI / Node Backend
   ↓
LLM / OCR / Database
```

---

# 3. Design Principles

The UI should NOT look like a normal medical dashboard.

It should feel like a combination of:

- Hospital kiosk
- ATM
- Voice assistant
- Simple mobile app

### Important principles

#### 1. Large touch targets

Minimum recommended:

```text
Button height: 56–64px
Important buttons: 64–72px
```

Avoid tiny text and small icons.

#### 2. Minimal text

Instead of:

> "Please provide details regarding the primary reason for your visit."

Use:

> **What brings you here today?**

#### 3. Voice-first

Every major question should have:

```text
🔊 Listen
🎤 Speak
⌨ Type
```

#### 4. Visual guidance

Use icons wherever possible.

Example:

```text
🤒 Fever
🤕 Headache
🫁 Breathing
❤️ Chest
🦴 Body pain
🤢 Stomach
```

#### 5. Always show progress

Example:

```text
Step 3 of 6

Your symptoms
██████████░░░░░░
```

---

# 4. Main Application Routes

Recommended Next.js routes:

```text
/
├── /welcome
├── /language
├── /identify
├── /consent
├── /intake
├── /documents
├── /review
├── /submitted
│
└── /doctor
    ├── /dashboard
    └── /patient/[id]
```

---

# 5. Patient Flow

## Screen 1 — Welcome

Route:

```text
/welcome
```

Purpose:

Introduce MediKiosk and start the patient's session.

### UI

Large MediKiosk logo.

```text
MediKiosk

Your medical history.
Simplified.

[ Start ]

🔊 Tap to hear instructions
```

Also show:

```text
This session usually takes 3–5 minutes.
```

### Primary action

```text
START
```

---

# 6. Language Selection

Route:

```text
/language
```

### UI

```text
Choose your language

अपनी भाषा चुनें

[ English ]
[ हिन्दी ]
[ ଓଡ଼ିଆ ]
[ বাংলা ]
```

For the hackathon MVP, support at least:

- English
- One Indian language

If the team can implement it, **Odia** would make the demo particularly relevant to Odisha.

After selection, all supported UI text and voice prompts should switch to that language.

---

# 7. Patient Identification

Route:

```text
/identify
```

### Options

```text
How would you like to continue?

[ Scan ABHA ]

[ Scan Aadhaar ]

[ New Patient ]
```

For the hackathon:

The scanner can be mocked.

Example:

```text
Scanning...

Patient found ✓

Name: Rajesh Kumar
Age: 54
```

For new patients:

```text
Enter your name

[ __________________ ]

Age

[ - ] 54 [ + ]

[ Continue ]
```

---

# 8. Consent Screen

Route:

```text
/consent
```

This is important because the project explicitly includes a consent layer and DPDP compliance angle.

### Keep it extremely simple.

```text
Before we begin

MediKiosk will ask about your health
and create a summary for your doctor.

Your information will only be used
for your hospital visit.

[ 🔊 Listen ]

☐ I understand and agree

[ Continue ]
```

Do not use a huge legal paragraph on the main screen.

Add:

```text
View privacy details →
```

for additional information.

---

# 9. Main AI Interview Screen

Route:

```text
/intake
```

This is the **most important screen in the entire frontend**.

The patient should feel like they are talking to a person.

### Layout

```text
┌───────────────────────────────────────────────┐
│ MediKiosk                         Step 3/6    │
├───────────────────────────────────────────────┤
│                                               │
│              🤖                               │
│                                               │
│       What brings you here today?             │
│                                               │
│       Tell me in your own words.              │
│                                               │
│                                               │
│              🎤                               │
│          Hold to speak                        │
│                                               │
│       ─────────────────────                   │
│                                               │
│ [ Type instead ]                              │
│                                               │
└───────────────────────────────────────────────┘
```

---

# 10. Voice Interaction

When the user presses the microphone:

```text
🎤 Listening...

Tell me what is troubling you.
```

Show an animated microphone.

After speech:

```text
You said:

"I have had chest pain since yesterday."

[ Edit ]

[ That's correct ✓ ]
```

Then the AI continues.

---

# 11. Adaptive Questions

The frontend must support dynamically generated questions.

Example:

### Question 1

```text
What brings you here today?
```

Patient:

```text
I have chest pain.
```

### Question 2

```text
When did the chest pain start?
```

### Question 3

```text
How would you describe the pain?
```

Options:

```text
[ Pressure ]
[ Burning ]
[ Sharp ]
[ Tightness ]
[ Other ]
```

### Question 4

```text
How severe is the pain?

0 ───────●────── 10

No pain          Worst pain
```

The frontend should NOT hard-code the entire interview.

The backend/AI should be able to return questions dynamically.

---

# 12. Suggested Question API Format

Frontend should expect something similar to:

```json
{
  "question_id": "pain_duration",
  "type": "single_choice",
  "text": "When did the pain start?",
  "options": [
    "Today",
    "Yesterday",
    "A few days ago",
    "More than a week ago"
  ]
}
```

Possible question types:

```text
text
voice
single_choice
multiple_choice
scale
date
number
yes_no
```

Frontend renders the correct component based on `type`.

---

# 13. Chat / Conversation UI

Maintain a simple conversation history.

Example:

```text
MediKiosk

🤖 What brings you here today?

👤 I have been having headaches.

🤖 How long have you had them?

👤 About three days.

🤖 How severe is the headache?
```

But don't make it look like WhatsApp.

The current question should remain the primary focus.

---

# 14. Emergency / Red Flag UI

The project includes a red-flag detector that can bypass the normal queue and alert triage staff.

The frontend needs a dedicated emergency state.

Example:

```text
⚠️

Please wait.

Your symptoms may need
urgent medical attention.

A hospital staff member
has been alerted.

Please remain here.

[ Call Staff ]
```

Important:

**Do not show an AI diagnosis.**

Never display:

```text
"You are having a heart attack."
```

Instead:

```text
"Your symptoms may need urgent medical attention."
```

---

# 15. Medical Documents Screen

Route:

```text
/documents
```

### UI

```text
Do you have previous medical reports?

You can upload prescriptions,
lab reports or discharge summaries.

[ 📷 Scan Document ]

[ 📁 Upload Document ]

[ Skip ]
```

After upload:

```text
Processing document...

████████████░░░

Reading your report...
```

Then show:

```text
Document processed ✓

Prescription
12 Aug 2026

Medicines detected:
• Medicine A
• Medicine B

[ Review ]

[ Continue ]
```

For the hackathon, OCR can be mocked or connected to an OCR API.

---

# 16. Review Screen

Route:

```text
/review
```

Before submission, allow the patient to review important information.

Example:

```text
Your Information

Name
Rajesh Kumar

Main problem
Chest pain

Started
Yesterday

Severity
7 / 10

Other symptoms
Breathlessness

Previous medicines
[ 2 medicines detected ]

[ Edit ]

[ Submit ]
```

Keep editing simple.

---

# 17. Doctor Summary Screen

Route:

```text
/doctor/patient/[id]
```

This is the second most important frontend screen.

The doctor should be able to understand the patient quickly.

### Header

```text
Patient: Rajesh Kumar
Age: 54
Token: A104

⚠️ Priority
```

---

# 18. Clinical Summary Layout

Use structured cards.

```text
┌────────────────────────────────────────────┐
│ Chief Complaint                            │
│ Chest pain since yesterday                 │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ History of Present Illness                 │
│ • Started yesterday                        │
│ • Severity: 7/10                          │
│ • Pressure-like                            │
│ • Associated breathlessness                │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ Medications                                │
│ • Medicine A                              │
│ • Medicine B                              │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ Allergies                                  │
│ No known allergies reported                │
└────────────────────────────────────────────┘
```

---

# 19. Clinical Structure

The summary should follow the project's proposed structure:

```text
CC
Chief Complaint

HPI
History of Present Illness

PMH
Past Medical History

Drug / Allergy

FH
Family History

PH
Personal History

ROS
Review of Systems
```

The AI output must be treated as an **editable draft**, not an autonomous diagnosis.

---

# 20. Doctor Editing

Every AI-generated section should have:

```text
✏ Edit
```

Example:

```text
Chief Complaint

Chest pain for 1 day.

[ ✏ Edit ]
```

The doctor can modify the information before confirming.

Primary action:

```text
[ Confirm & Continue ]
```

---

# 21. ABDM/FHIR Demo

For the hackathon, create a simulated integration state.

After submission:

```text
✓ Clinical history saved

✓ Doctor summary generated

✓ ABHA record updated

✓ Hospital system notified
```

If the actual backend integration isn't available:

```text
ABDM/FHIR Integration — DEMO
```

Make it clear that this is a mock integration.

---

# 22. Application State

Create a global patient session.

Example:

```typescript
interface PatientSession {
  patientId: string;
  name: string;
  age: number;
  language: string;

  consentGiven: boolean;

  symptoms: Symptom[];

  conversation: ConversationMessage[];

  documents: MedicalDocument[];

  summary?: ClinicalSummary;

  priority?: "normal" | "urgent";
}
```

---

# 23. Component Structure

Recommended structure:

```text
components/

├── layout/
│   ├── KioskLayout
│   ├── Header
│   ├── ProgressBar
│   └── Footer
│
├── patient/
│   ├── PatientRegistration
│   ├── LanguageSelector
│   ├── ConsentCard
│   └── PatientSummary
│
├── voice/
│   ├── VoiceButton
│   ├── ListeningIndicator
│   └── AudioPrompt
│
├── interview/
│   ├── QuestionCard
│   ├── AnswerInput
│   ├── ChoiceQuestion
│   ├── ScaleQuestion
│   └── ConversationView
│
├── documents/
│   ├── DocumentUploader
│   ├── DocumentScanner
│   └── OCRResult
│
├── doctor/
│   ├── PatientQueue
│   ├── ClinicalSummary
│   ├── SummarySection
│   └── EditSummary
│
└── emergency/
    └── RedFlagAlert
```

---

# 24. Suggested Folder Structure

```text
app/
│
├── page.tsx
│
├── welcome/
│   └── page.tsx
│
├── language/
│   └── page.tsx
│
├── identify/
│   └── page.tsx
│
├── consent/
│   └── page.tsx
│
├── intake/
│   └── page.tsx
│
├── documents/
│   └── page.tsx
│
├── review/
│   └── page.tsx
│
├── submitted/
│   └── page.tsx
│
└── doctor/
    ├── dashboard/
    │   └── page.tsx
    │
    └── patient/
        └── [id]/
            └── page.tsx
```

---

# 25. Visual Design

### Colors

Use a healthcare-inspired palette.

Suggested:

```text
Primary: Blue / Teal
Background: Very light neutral
Success: Green
Warning: Amber
Emergency: Red
Text: Dark navy/gray
```

Don't overuse gradients.

The interface should feel:

- Safe
- Clean
- Government-hospital friendly
- Modern
- Accessible
- Trustworthy

---

# 26. Typography

Recommended:

```text
Font: Inter / Noto Sans
```

For Indian languages:

Use a font with good Unicode support.

Important text:

```text
32–48px
```

Normal text:

```text
18–24px
```

Kiosk UI should generally be larger than a normal web application.

---

# 27. Accessibility

The frontend should support:

- Large text
- High contrast
- Voice instructions
- Touch interaction
- Keyboard fallback
- Simple language
- Clear error messages
- No tiny controls

Avoid relying only on color.

For example, don't indicate emergency status using only red.

Use:

```text
⚠️ URGENT
```

---

# 28. Error States

Every important action needs an understandable error state.

### Microphone error

```text
We couldn't hear you.

Please try again.

[ 🎤 Try Again ]

[ Type Instead ]
```

### Upload error

```text
We couldn't read this document.

Please take another photo.

[ Scan Again ]

[ Skip ]
```

### Network error

```text
Connection lost.

Your information has not been submitted.

[ Try Again ]
```

---

# 29. Loading States

Never show a blank screen.

Instead:

```text
🤖

I'm preparing the next question...

● ● ●
```

For OCR:

```text
📄

Reading your document...

This may take a few seconds.
```

For summary generation:

```text
Creating your doctor's summary...

✓ Reviewing symptoms
✓ Organizing medical history
● Preparing summary
```

---

# 30. Hackathon MVP Priority

Do NOT try to build everything.

### P0 — Must Have

Build these first:

```text
✓ Welcome
✓ Language selection
✓ Consent
✓ Patient registration
✓ AI interview
✓ Voice input
✓ Dynamic questions
✓ Progress indicator
✓ Structured summary
✓ Doctor review screen
```

This matches the project's recommended minimum viable demo: a web/mobile chat + voice interface conducting a symptom interview and producing a structured clinical summary.

### P1 — If Time Allows

```text
✓ Document upload
✓ OCR result
✓ Red-flag UI
✓ Mock ABHA/FHIR push
```

### P2 — Only if Everything Else Works

```text
✓ Multiple Indian languages
✓ Advanced animations
✓ Detailed doctor dashboard
✓ Real-time queue
✓ Advanced document timeline
```

---

# 31. Demo Flow

For the actual hackathon presentation, use this exact flow:

```text
WELCOME
   ↓
SELECT LANGUAGE
   ↓
CONSENT
   ↓
PATIENT IDENTIFICATION
   ↓
"WHAT BRINGS YOU HERE?"
   ↓
VOICE RESPONSE
   ↓
AI FOLLOW-UP QUESTIONS
   ↓
SYMPTOM DETAILS
   ↓
UPLOAD OLD PRESCRIPTION
   ↓
OCR
   ↓
GENERATE SUMMARY
   ↓
DOCTOR DASHBOARD
   ↓
DOCTOR EDITS SUMMARY
   ↓
CONFIRM
   ↓
"ABHA/HIS UPDATED ✓"
```

---

# 32. What the Frontend Team Should NOT Build

Avoid spending hackathon time on:

```text
❌ Full hospital management system
❌ Complete ABHA integration
❌ Real Aadhaar verification
❌ Complex authentication
❌ Production-grade OCR pipeline
❌ Complete EMR
❌ Autonomous diagnosis
❌ Complicated admin dashboard
```

The project itself emphasizes that the innovation is the orchestration of existing technologies and that the AI output should remain an editable draft for the doctor.

---

# 33. Definition of Done

The frontend is ready for the hackathon when a judge can sit in front of the application and complete this without developer assistance:

```text
1. Start MediKiosk
2. Select language
3. Give consent
4. Enter patient details
5. Answer questions using microphone
6. See adaptive questions
7. Upload a sample prescription
8. Review collected information
9. Submit
10. See a structured clinical summary
11. Open doctor view
12. Edit/confirm summary
13. See successful submission/integration state
```

The entire journey should take approximately **3–5 minutes for the demo**.

---

# 34. Final Frontend Goal

The frontend should communicate one idea immediately:

> **"This is not a hospital registration kiosk. This kiosk actually understands the patient's story and prepares it for the doctor."**

The strongest demo moment should be:

```text
PATIENT

🎤 "I've had chest pain since yesterday
and I'm also having trouble breathing."

             ↓

MEDIKIOSK

Analyzes conversation
        +
Previous medical records
        ↓

DOCTOR

┌─────────────────────────────┐
│ ⚠️ PRIORITY                 │
│                             │
│ Chief Complaint             │
│ Chest pain × 1 day         │
│                             │
│ Associated symptom          │
│ Breathlessness              │
│                             │
│ Severity                    │
│ 7/10                        │
│                             │
│ [ Edit ] [ Confirm ]        │
└─────────────────────────────┘
```

That transformation — **patient conversation → structured clinical history → doctor-ready summary** — is the core frontend experience.

---

# Production-Readiness & Navigation Upgrades (Implemented)

This section records the frontend changes made to address the earlier review
gaps: **no login / the dashboard was only reachable by typing the URL, a dead
Logout button, and hard-coded doctor profile.**

## Doctor Authentication Flow

- **Login page** — `frontend/src/pages/DoctorLoginPage.tsx` (`/doctor/login`)
  authenticates against the backend `POST /api/v1/auth/login` and stores the
  JWT in `localStorage`. Includes a split-layout (navy branding panel + form),
  a working "demo credentials" autofill, and inline error display.
- **Auth store** — `frontend/src/store/useAuth.ts` (Zustand) manages
  `user`, `token`, `login`, `logout`, and `restore` (session restore on refresh).
- **Route guard** — `frontend/src/components/doctor/RequireAuth.tsx` wraps the
  doctor routes (`/doctor/dashboard`, `/doctor/patient/:id`, `/voice`). It
  restores the session and redirects to `/doctor/login` when unauthenticated,
  so users no longer need to type a URL to reach (or protect) the dashboard.
- **Token injection** — `frontend/src/api/client.ts` now attaches
  `Authorization: Bearer <token>` to every request and exposes `login()` /
  `getMe()` plus `storeAuthToken()` / `getStoredToken()`.
- **Functional Logout** — the sidebar "Logout" button in
  `frontend/src/components/doctor/DoctorLayout.tsx` now clears the token and
  redirects to the login page. The sidebar and header avatars now render the
  logged-in doctor's name, specialty, and initials from the auth store.

## Updated Routes (`frontend/src/App.tsx`)

```
/doctor/login                    -> DoctorLoginPage   (public)
/doctor/dashboard                -> RequireAuth -> DoctorDashboard
/doctor/patient/:id              -> RequireAuth -> DoctorPatientPage
/voice                           -> RequireAuth -> VoiceInputPage
```

## Workflow Preserved

The end-to-end experience is unchanged for the patient kiosk:

```
Patient speaks -> AI collects history -> AI structures info
 -> documents digitized -> doctor receives concise clinical summary
 -> doctor reviews -> confirms
```

The kiosk's "View Doctor Dashboard" (SubmittedPage) now flows through the auth
guard, landing on the login page if the doctor is not yet signed in.

## Verification

- `npm run build` (strict TS + Vite) passes.
- `npm run lint` (oxlint) passes with no warnings.

## Remaining Production Gaps

- Persistent refresh tokens / remember-me across browser restarts beyond the
  stored JWT.
- Explicit role-based UI (admin vs. doctor vs. staff).

## Visible Doctor Login Entry (Kiosk Welcome Screen)

Previously the only way to reach the doctor workspace was typing
`/doctor/login` in the address bar. A visible **Doctor / Staff Login** button
(`frontend/src/pages/WelcomePage.tsx`) now navigates directly to
`/doctor/login`, and the login page's "Back to Kiosk" link returns to `/welcome`
— so staff can reach the dashboard from the kiosk with no URL typing.

## Dashboard Reflects Real Data

`frontend/src/pages/DoctorDashboard.tsx` previously hard-coded the four stat
cards (124 / 32 / 92 / 10) and a mock `DEMO_CASES` table regardless of backend
state. Now:

- The stats (Total / Pending / Completed / Priority) are computed from the
  live `queue` loaded from the API when data exists, falling back to the
  spec's polished demo numbers **only** when the queue is genuinely empty.
- The "Today's Cases" table and the "Priority Case" card render real patient
  data (name, age/sex, token, urgency) and link to the real patient route.
- The mobile case-count badge now shows the actual number of rendered rows.

## System Status Badges

The dashboard fetches `GET /api/v1/system/capabilities` and shows honest
status chips (AI / OCR / FHIR / Data = live vs. simulated), so the demo clearly
indicates which subsystems are wired to real providers vs. fallbacks. Wiring a
real `LLM_API_KEY` (or `OCR_API_KEY` + `OCR_ENDPOINT`) flips the corresponding
badge to live with no frontend changes.

## Root Orchestrator

A root `package.json` with `concurrently` + `npm --prefix` scripts lets the
whole project run from one place (`npm run dev`, `npm run build`, `npm test`,
`npm run lint`, `npm run install:all`). See the root `README.md`.
