# AGENTS.md — Patient Portal · AI Agent Handoff Document

> **Purpose:** This file gives any AI agent (Claude, Gemini, Copilot, etc.) a complete mental model of this repository so it can immediately contribute without discovery overhead. Read this before writing a single line of code.

---

## 1. What This Project Is

A **full-stack patient healthcare portal** for the Delhi, India market. Patients can:

- Book outpatient appointments at real Delhi hospitals with real doctors
- Submit emergency requests that alert on-call doctors in real time
- Request ambulances with live status tracking
- Run AI-powered symptom triage (regular / priority / emergency)
- Upload and parse medical lab reports (PDFs, images) with automatic abnormality detection
- Verify medicines by batch code
- Track treatments and medical records

**Tech stack:** React 19 (CRA) · Express 4 · Supabase (PostgreSQL) · JWT Auth · Google OAuth · Vercel (frontend) + Vercel Serverless (backend)

---

## 2. Repository Layout

```
patient-frontend-final/
├── src/                          # React frontend (CRA)
│   ├── App.js                    # Router — all client routes defined here
│   ├── pages/                    # One file per feature page
│   ├── components/
│   │   └── DashboardLayout.js    # Shared sidebar/nav wrapper
│   └── utils/
│       ├── api.js                # ★ CENTRAL API CLIENT — all fetch calls go here
│       └── labReportAnalyzer.js  # ★★ THE BRAIN — see Section 4
│
├── server/                       # Express backend (ESModule, "type":"module")
│   ├── index.js                  # Entry point — mounts all routes, starts server
│   ├── config/
│   │   └── supabaseClient.js     # Supabase SDK singleton
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT Bearer token verification
│   ├── routes/                   # Thin route files — just map verbs to controllers
│   ├── controllers/              # ★ ALL BUSINESS LOGIC lives here
│   ├── database/
│   │   ├── schema.sql            # ★ CANONICAL DB SCHEMA — single source of truth
│   │   ├── seed.js               # Populates cities/departments/hospitals from CSV
│   │   └── *.sql                 # Migration files for column additions
│   └── data/
│       └── delhiEmergencyDirectory.js  # ★ Static hospital directory for emergency routing
│
├── data/
│   ├── delhi_doctor_directory.csv      # Seed data: doctors × hospitals
│   └── delhi_doctor_schedules.csv      # Seed data: weekly schedules per doctor
│
├── public/
│   └── pdf.worker.min.mjs              # pdf.js worker (must stay in public/ — CRA constraint)
│
├── vercel.json                   # Deployment config — frontend + serverless backend
├── .env.example                  # Frontend env template
└── server/.env.example           # Backend env template
```

---

## 3. Antigravity IDE Artifacts

This project was built with **Google Antigravity IDE**. Antigravity writes agent-state files to `.antigravity/` — these are typically `.gitignore`'d but are the living memory of past agent sessions.

### Where to look

| Path | What it contains | Status |
|---|---|---|
| `.antigravity/brain/task.md` | Current task checklist the agent was mid-execution on | Not committed (gitignored) |
| `.antigravity/brain/implementation_plan.md` | The active implementation plan at time of last session | Not committed (gitignored) |
| `.antigravity/brain/walkthrough.md` | Post-completion summaries of what was built | Not committed (gitignored) |
| `.antigravity/knowledge/` | Learned patterns, API conventions, testing standards | Not committed (gitignored) |
| `.agents/agents.md` | Team persona definitions (`@pm`, `@engineer`, `@qa`, `@devops`) | Not present — would live here |
| `.agents/skills/` | Modular skill instruction files (`.md` per skill) | Not present |
| `.agents/workflows/` | Custom slash commands (e.g., `/startcycle`) | Not present |

### If you are working in Antigravity

1. Check `Agent Manager → Knowledge Base` for persisted patterns before starting any task.
2. Antigravity generates **Artifacts** (task lists, implementation plans) before acting — review them and leave inline comments to redirect the agent mid-run.
3. The agent saves useful conventions to the Knowledge Base after each task; those patterns inform future sessions automatically.

### Bootstrapping `.agents/` for pipeline work

If you want to add multi-agent workflow support, the canonical structure is:

```
.agents/
├── agents.md          # Persona definitions (@pm, @engineer, @qa, @devops)
├── skills/
│   ├── write_specs.md
│   ├── generate_code.md
│   ├── audit_code.md
│   └── deploy_app.md
└── workflows/
    └── startcycle.md  # /startcycle slash command
```

See [Google Codelabs: Autonomous AI Developer Pipelines](https://codelabs.developers.google.com/autonomous-ai-developer-pipelines-antigravity) for the full pattern.

---

## 4. The Brain — `src/utils/labReportAnalyzer.js`

**This is the most complex and valuable piece of logic in the entire codebase.** Do not modify it carelessly.

### What it does

It is a **pure-JS medical lab report parser** (~900 lines) that:

1. **Extracts text** from PDFs (via `pdfjs-dist` with Y-coordinate line reconstruction), images (via `tesseract.js` OCR), and plain text files.
2. **Detects 60+ lab markers** by alias matching (e.g., `"hba1c"`, `"glycated hemoglobin"`, `"glycosylated hemoglobin"` all resolve to `HbA1c`).
3. **Extracts numeric values** with confidence scoring, handling edge cases like:
   - Values split across lines
   - Reference ranges encoded as `10-12 g/dL` vs `< 100` vs categorical bands (`Desirable: <200; Borderline High: 200-239`)
   - Private-use PDF font encoding (`\uF000-\uF0FF` normalization)
   - Lab-specific flag words (`H`, `L`, `HH`, `LL`, `critical`)
4. **Classifies each result** as `normal` / `high` / `low` / `critical` / `uncertain` using report-specific ranges (preferred) or built-in defaults.
5. **Groups findings** into clinical categories: CBC, Lipid Panel, Kidney Function, Liver Function, Thyroid, Diabetes, Vitamin Deficiencies, Infectious Disease Screenings, etc.
6. **Generates prose interpretations** per group (e.g., "The report is consistent with prediabetes…").
7. **Extracts metadata**: report date (15+ date format variations), referring doctor, lab facility.

### Key exports

```js
analyzeLabReport(rawText)         // Main entry — returns { vitals, metadata, analysis }
extractTextFromFile(file)         // Async — handles PDF/image/text → rawText
buildAnalysis(vitals, rawText)    // Builds the analysis summary object
generateFindingsGroups(vitals)    // Groups vitals into clinical finding sections
extractReportMetadata(rawText)    // Extracts date, doctor, facility
```

### Critical constants / data

| Symbol | Purpose |
|---|---|
| `LAB_MARKERS` | Array of 60+ marker definitions: `{ name, aliases[], unit, min, max, low[], high[] }` |
| `UNIT_ALIASES` | Maps canonical units to lab-specific variants (e.g. `g/dL → ["gm/dl", "g dl"]`) |
| `STOP_WORDS` | Words that look like marker aliases but aren't (age, date, page, id, pin, phone) |
| `MAX_OCR_PDF_PAGES` | `8` — caps OCR page count to control runtime |
| `MAX_PDF_PARSE_BYTES` | `10 MB` — caps fallback regex PDF extraction |

### Special-case logic to be aware of

- **HbA1c** has hardcoded reference range text (`"Diabetes >6.5%, Prediabetes 5.7-6.4%, Normal <5.7%"`) and a strict validity gate — result must be a same-row `%` value between `2.0` and `20.0`.
- **`"Hb"` alias disambiguation**: if the line containing `Hb` also includes `a1c`, `glyc`, `avg`, or `estimat`, it is skipped (prevents `HbA1c` lines from being parsed as `Hemoglobin`).
- **Qualitative markers** (`HIV Screening`, `HBsAg`, `Urine Glucose`) use `isQualitative: true` and match against `positiveTerms` / `negativeTerms` string arrays instead of numeric ranges.
- **Categorical reference ranges** (LDL cholesterol bands) are parsed by `parseCategoricalReferenceFromTail()` and fed into `statusFromCategoricalBands()`.
- **pdf.js worker** is loaded from `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`. The file is physically at `public/pdf.worker.min.mjs`. Do not move it; webpack cannot bundle web workers in CRA.

---

## 5. The Secondary Brain — `server/controllers/triageController.js`

A keyword-based symptom triage engine that classifies incoming symptoms as `emergency`, `priority`, or `regular`, and infers the correct hospital department.

### Triage classification

```
EMERGENCY_KEYWORDS  → "chest pain", "stroke", "seizure", "unconscious", "severe bleeding", …
PRIORITY_KEYWORDS   → "high fever", "severe pain", "fracture", "asthma", "dehydration", …
DEFAULT             → "regular"
```

### Department inference (`inferDepartment`)

Keyword → Department mapping:
- chest / heart / heartbeat → Cardiology
- breathing / asthma / cough → General Medicine
- fracture / injury / accident / joint → Orthopedics
- child / pediatric → Pediatrics
- skin / rash / allergic → Dermatology
- seizure / stroke / head injury / numbness → Neurology
- (default) → General Medicine

The triage result is persisted as a `triage_requests` row and its UUID (`triage_id`) is passed forward to the appointment and emergency booking flows, linking the clinical justification to the slot reservation.

---

## 6. Emergency Directory — `server/data/delhiEmergencyDirectory.js`

A static JS module that encodes real Delhi hospital data for the emergency booking flow:
- `DELHI_EMERGENCY_HOSPITALS` — array of hospital objects with `name`, `aliases[]`, `address`, `phone`, `emergencyPhone`, `bedCapacity`, `ambulanceFleet`, locality tags
- `LOCALITY_HOSPITAL_PRIORITY` — maps Delhi locality names to ordered hospital preference lists

The `emergencyController.js` uses this directory to populate real-time hospital availability even when the Supabase `hospitals` table lacks the extended resource columns (it has a graceful fallback).

---

## 7. Database Schema — `server/database/schema.sql`

**Always check `schema.sql` before writing any Supabase query.** It is the canonical source of truth. The schema includes:

| Table | Purpose | Frontend consumer |
|---|---|---|
| `patients` | User accounts (bcrypt password, Google OAuth) | `Login.js`, `Register.js`, `Dashboard.js` |
| `appointments` | Booked slots (unique index on `doctor_hospital_id + date + time`) | `Appointment.js` |
| `medical_records` | Uploaded reports + JSONB `vitals` + JSONB `analysis` | `MedicalRecords.js` |
| `medications` | Active prescriptions | `MedicineVerification.js` |
| `treatments` | Treatment plans with `progress` (0–100) | `Treatments.js` |
| `priority_queue` | Legacy triage queue | `PrioritySystem.js` |
| `medicine_verifications` | Verification audit log | `MedicineVerification.js` |
| `medicine_batches` | Authoritative batch registry (indexed on `batch_code`) | `MedicineVerification.js` |
| `treatment_diary_logs` | Diary entries linked to treatments | `Treatments.js` |
| `cities` | Reference — city lookup | Appointment flow |
| `departments` | Reference — department lookup | Appointment flow |
| `hospitals` | Hospital data with emergency resource columns | All booking flows |
| `doctors` | Doctor profiles | Appointment flow |
| `doctor_hospitals` | Many-to-many: doctor × hospital (consultation fee, room) | Appointment flow |
| `doctor_schedules` | Weekly availability per `doctor_hospital_id` | Appointment flow |
| `triage_requests` | Triage results linked to appointments/emergencies | `PrioritySystem.js` |
| `emergency_requests` | Patient emergency submissions with doctor assignment | `EmergencyBooking.js` |
| `emergency_alerts` | Per-doctor alert delivery/response tracking | Doctor alert flow |
| `ambulance_requests` | Ambulance dispatch records | `EmergencyBooking.js` |

### Migration pattern

The codebase uses inline `ALTER TABLE … ADD COLUMN IF NOT EXISTS` at the bottom of `schema.sql` rather than separate migration files (except `server/database/*.sql`). When adding columns, follow this pattern and keep `schema.sql` as the definitive file.

---

## 8. API Design

### Frontend → Backend

All frontend fetch calls go through `src/utils/api.js`. It:
- Reads `REACT_APP_API_URL` from env (defaults to `http://<hostname>:5000/api` in dev, `/api` in prod)
- Injects `Authorization: Bearer <token>` from `localStorage` or `sessionStorage`
- Auto-redirects to `/login` on 401/403 or a `"Patient not found"` error body

**To add a new endpoint:** add a named export to `api.js` — do not inline `fetch()` calls in pages.

### Route → Controller mapping

Every `server/routes/*.js` file is a thin pass-through. All logic lives in `server/controllers/`. The server entry point (`server/index.js`) maps:

```
/api/auth             → authRoutes        → authController
/api/dashboard        → dashboardRoutes   → dashboardController
/api/appointments     → appointmentRoutes → appointmentController
/api/medical-records  → medicalRecords…   → medicalRecordsController
/api/medicines        → medicineRoutes    → medicineController
/api/treatments       → treatmentRoutes   → treatmentController
/api/priority         → priorityRoutes    → priorityController
/api/triage           → triageRoutes      → triageController
/api/emergency-requests → emergencyRoutes → emergencyController
/api/ambulance-requests → ambulanceRoutes → ambulanceController
/api/doctor           → doctorRoutes      → doctorController
```

Top-level aliases for the appointment step-through (`/api/cities`, `/api/departments`, `/api/hospitals`, `/api/doctors`) are also registered directly in `index.js`.

### Auth

- **JWT** (HS256) issued on login/register/Google OAuth, signed with `JWT_SECRET`.
- Token payload shape: `{ id: <patient_uuid>, email, role, name, … }`
- `authenticateToken` middleware attaches decoded payload to `req.user`.
- All routes except `/api/auth` are protected.

---

## 9. Environment Variables

### Frontend (`.env` at root)

```env
REACT_APP_GOOGLE_CLIENT_ID=   # Google OAuth client ID
REACT_APP_API_URL=            # Override API base URL (optional in dev)
```

### Backend (`server/.env`)

```env
PORT=5000
JWT_SECRET=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # Used by the backend (service role bypasses RLS)
GOOGLE_CLIENT_ID=
EMAIL_USER=                   # Nodemailer SMTP user (fallback email)
EMAIL_PASS=                   # Nodemailer SMTP password
RESEND_API_KEY=               # Resend API for transactional email
```

---

## 10. Running Locally

```bash
# 1. Install all deps
npm install && cd server && npm install && cd ..

# 2. Copy and fill env files
cp .env.example .env
cp server/.env.example server/.env

# 3. Run Supabase schema
# Open supabase.com → your project → SQL Editor → paste server/database/schema.sql → Run

# 4. Seed doctors/hospitals (optional)
cd server && node database/seed.js

# 5. Start both frontend and backend
npm run dev        # runs concurrently: react-scripts start + nodemon server/index.js
```

Frontend: `http://localhost:3000`  
Backend: `http://localhost:5000`  
Health check: `GET http://localhost:5000/health`

---

## 11. Deployment

Vercel handles everything via `vercel.json`:
- `@vercel/static-build` builds the React app from `package.json` → `build/`
- `@vercel/node` serves `server/index.js` as a serverless function
- Rewrites: `/api/*` → `server/index.js`, everything else → `index.html` (SPA fallback)

Set all `server/.env` variables as Vercel environment variables. The backend detects `NODE_ENV=production` and skips `app.listen()` (Vercel handles the port).

---

## 12. Key Patterns & Gotchas

1. **ESModule backend**: `server/` uses `"type": "module"` — always use `import`/`export`, never `require()`.
2. **Supabase client uses service role key** — this bypasses Row Level Security. Do not expose it to the frontend.
3. **pdf.js worker must stay in `public/`** — CRA cannot bundle web workers. The path is hardcoded as `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`.
4. **Emergency request expiry**: `expireOldEmergencyRequests()` runs on startup and every 5 minutes. It auto-closes stale open emergency requests.
5. **Appointment slots are unique**: `UNIQUE INDEX unique_appt_slot ON appointments(doctor_hospital_id, appointment_date, appointment_time)` — double-booking is prevented at the DB level.
6. **`data/` CSVs are seed-only**: `delhi_doctor_directory.csv` and `delhi_doctor_schedules.csv` are consumed by `server/database/seed.js` to populate Supabase. They are not read at runtime.
7. **`labReportAnalyzer.js` is frontend-only**: It runs entirely in the browser (PDF.js + Tesseract.js are browser libraries). The parsed results are then POSTed to `/api/medical-records` for storage.
8. **Token storage**: The frontend stores JWT in `localStorage` or `sessionStorage` (depending on "Remember me"). The `api.js` helper checks both.
9. **CORS**: The backend has `cors({ origin: '*' })` — intentional for local network testing. Restrict this in production.

---

## 13. Where to Add New Features

| Feature type | Where to add it |
|---|---|
| New frontend page | `src/pages/NewPage.js` + route in `src/App.js` |
| New API call from frontend | Named export in `src/utils/api.js` |
| New backend endpoint | `server/routes/newRoutes.js` → `server/controllers/newController.js` → mount in `server/index.js` |
| New DB table/column | `server/database/schema.sql` (with `IF NOT EXISTS`) |
| New lab marker | Add to `LAB_MARKERS` array in `src/utils/labReportAnalyzer.js` following the existing object shape |
| New triage keyword | Add to `EMERGENCY_KEYWORDS` or `PRIORITY_KEYWORDS` in `server/controllers/triageController.js` |
| New Delhi hospital (emergency) | Add to `DELHI_EMERGENCY_HOSPITALS` in `server/data/delhiEmergencyDirectory.js` |
| New email template | Use `resend` package in the relevant controller (see `authController.js` for pattern) |