# MediKiosk — AI-Powered Clinical History & Intake Management System

**Category:** HealthTech / AI + NLP / Digital Public Infrastructure
**Track fit:** AI for Social Good, HealthTech Innovation, GovTech / ABDM Integration

---

## 1. Problem Statement

Indian government hospital OPDs handle 4,000–10,000+ patients a day, but doctors get only **2–5 minutes per consultation** — one of the shortest in the world. Most of that time is lost to:

- Manually asking basic history questions instead of examining and diagnosing
- Flipping through fragmented paper prescriptions, lab reports, and discharge summaries from other providers
- Repeating the same intake questions visit after visit
- No structured capture of Ayurvedic/AYUSH history parameters (Prakriti, Vikriti, Agni, etc.), which need much deeper intake than allopathic care

Existing hospital kiosks only capture **name, age, token number** — zero clinical value. Health apps require smartphones, literacy, and pre-registration, excluding the elderly/rural/first-visit patients who make up most OPD traffic.

## 2. Proposed Solution

**MediKiosk** — a self-service AI kiosk/app that talks to the patient (voice + touch) *before* they meet the doctor, builds a structured clinical history, digitizes their old medical documents, and hands the doctor a ready-to-review summary the moment the patient walks in.

**Core idea in one line:** *An ATM for clinical history-taking — patients "check in" their symptoms and paperwork, doctors get a diagnosis-ready brief.*

## 3. System Architecture (4 Modules)

| Module | Function | Key Tech |
|---|---|---|
| **A. Conversational History Engine** | Voice/touch interview using SOCRATES-style adaptive questioning; branches based on chief complaint | Indian-language ASR (AI4Bharat/Bhashini), LLM dialogue manager, TTS |
| **B. Document Digitization** | OCR + entity extraction from old prescriptions/reports; builds a timeline, flags abnormal values | Handwriting OCR, medical NER, drug-interaction rules engine |
| **C. Summary Generator** | Fuses conversation + documents into a standard clinical format (CC → HPI → PMH → Drug/Allergy → FH → PH → ROS) | LLM summarization, editable draft (never auto-diagnosis) |
| **D. Consent & ABDM Integration** | ABHA login, granular consent, FHIR push to HIS/EMR, auto-purge of session data | ABDM FHIR APIs, DPDP Act 2023-compliant consent layer |

**Cross-cutting feature — Red-flag detection:** if the AI detects emergency symptom patterns (e.g., chest pain + breathlessness, stroke signs), it bypasses the queue and alerts triage staff immediately.

## 4. Patient Journey (Demo Flow for Hackathon)

1. **Identify** — scan ABHA/Aadhaar or register as new, pick language, audio-guided consent
2. **Converse** — AI asks "What brings you in today?" → adaptive follow-ups (onset, duration, severity...)
3. **Scan** — patient photographs/uploads old prescriptions and lab reports
4. **Summarize & Route** — structured summary auto-pushed to doctor's screen + ABHA record
5. **Consult** — doctor reviews in seconds, edits/confirms, spends full time on examination

## 5. What Makes This a Strong Hackathon Build (Scoped MVP)

You don't need to build all 4 modules fully — pick a **demo-able slice**:

- **Minimum viable demo:** A web/mobile chat+voice interface (module A) that conducts a symptom interview in 1–2 languages and outputs a structured SOAP-style summary (module C) — this alone is compelling and buildable in a hackathon.
- **Stretch goal 1:** Add OCR upload (module B) using an off-the-shelf OCR API + an LLM prompt to extract diagnosis/medicines/values from a sample prescription image.
- **Stretch goal 2:** Mock ABDM/FHIR push — even a fake "Pushed to HIS ✅" API call with a JSON payload shows you understand the integration story (judges love this even simulated).
- **Stretch goal 3:** Red-flag detector — a simple rules/LLM classifier on symptom keywords that triggers a priority alert UI.

## 6. Suggested Tech Stack

- **Frontend:** React/Next.js kiosk UI, large touch targets, icon-driven for low literacy
- **Voice:** Web Speech API for demo (swap for Bhashini/Whisper in production), TTS via browser or ElevenLabs
- **AI/LLM:** Claude/GPT API for the dialogue manager + summarizer, with a strict clinical-history prompt/ontology (not free-form chat)
- **OCR:** Google Vision / Tesseract / Azure Document Intelligence for prescription scans
- **Backend:** FastAPI/Node, Postgres for session + FHIR-shaped JSON storage
- **Compliance angle:** show a consent screen + auto-delete-after-submission logic — even a stub demonstrates DPDP-Act awareness

## 7. Why It Wins (Judging Criteria Angle)

- **Real, quantified problem:** 2-minute consultations, cited BMJ Open 2017 study across 67 countries
- **Novelty:** existing kiosks only do admin check-in; this does clinical intake — a genuine gap
- **Feasibility:** every component (ASR, OCR, LLM summarization) is off-the-shelf today; the innovation is the *orchestration*, not new research
- **Social impact:** directly targets India's most under-served users — elderly, rural, low-literacy, first-visit patients
- **Government alignment:** plugs into existing ABDM/ABHA infrastructure rather than competing with it — makes it pitch-able to health-tech and GovTech judges alike
- **Safety framing:** explicitly positions AI output as an *editable draft for the doctor*, never an autonomous diagnosis — important for judges evaluating clinical-AI risk

## 8. One-Line Pitch (for submission form)

> "MediKiosk turns hospital waiting time into diagnostic time — an AI kiosk that takes a patient's full medical history by voice, digitizes their old records, and hands doctors a ready-to-review summary before the patient even sits down."

---
*Adapt module scope to your team size and hackathon duration — the interview engine (Module A) alone, done well with a clean UI and a real clinical-history prompt structure, is a complete and demo-ready hackathon project.*