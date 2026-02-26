# EHR NATIONAL SYSTEM — DEVELOPMENT ROADMAP
> Sistem Rekam Medis Digital Nasional Terintegrasi  
> Scope: No AI, Dummy Data for MVP, Production-Ready Architecture  
> Stack: NestJS + PostgreSQL + Next.js + React Native + Keycloak + MinIO + HAPI FHIR  
> Total Estimated Duration: 14–18 months (part-time ~20h/week)

---

## PHASE 0 — ENVIRONMENT, FOUNDATION & SCHEMA DESIGN
**Duration:** 4–6 weeks  
**Goal:** Stable development environment, production-ready project structure, FHIR-aware database schema with dummy seed data.

---

### 0.1 — Development Environment Setup

**Tasks:**
- [ ] Install Ubuntu 22.04 LTS (or WSL2 on Windows)
- [ ] Install Docker Desktop + Docker Compose v2
- [ ] Install Node.js v20 LTS via nvm
- [ ] Install Git + configure SSH key to GitHub
- [ ] Install VS Code with extensions:
  - Prisma
  - ESLint
  - Prettier
  - REST Client
  - Docker
  - GitLens
  - Thunder Client
- [ ] Setup `.editorconfig` for consistent formatting across team

**Output:**
- Environment reproducible: any new developer can run `docker-compose up` and everything works
- README with setup instructions committed to repo

---

### 0.2 — Monorepo Project Structure

**Tasks:**
- [ ] Initialize monorepo using **Turborepo**
- [ ] Create base folder structure:
  ```
  /
  ├── apps/
  │   ├── web/          # Next.js (Doctor, Admin dashboard)
  │   ├── mobile/       # React Native Expo (Patient app)
  │   └── api/          # NestJS backend
  ├── packages/
  │   ├── shared/       # Zod schemas, TypeScript types, constants
  │   ├── fhir/         # FHIR R4 mappers and resource types
  │   └── ui/           # Shared UI components (optional)
  ├── infra/
  │   ├── docker/       # Dockerfiles per service
  │   └── k8s/          # Kubernetes manifests (future)
  └── docs/
      ├── adr/          # Architecture Decision Records
      ├── schema/       # ERD diagrams
      └── api/          # API documentation
  ```
- [ ] Setup `turbo.json` with pipeline: `build`, `test`, `lint`, `dev`
- [ ] Setup root `package.json` with workspaces
- [ ] Setup shared ESLint + Prettier config in root, extended by all apps
- [ ] Setup **Husky** + **lint-staged**: auto-lint and auto-test on every commit
- [ ] Setup **commitlint** with Conventional Commits standard
- [ ] Create `Makefile` with shortcuts:
  ```makefile
  make dev        # Start all services
  make test       # Run all tests
  make migrate    # Run DB migrations
  make seed       # Seed dummy data
  make lint       # Lint all packages
  make build      # Build all apps
  ```

**Output:**
- Monorepo scaffold committed
- All developers can run `make dev` to start entire stack

---

### 0.3 — Docker Compose Full Stack

**Tasks:**
- [ ] Create `docker-compose.yml` with all services:
  ```yaml
  services:
    postgres:       # PostgreSQL 16
    redis:          # Redis 7
    minio:          # MinIO (S3-compatible storage)
    keycloak:       # Keycloak 24 (Identity Provider)
    vault:          # HashiCorp Vault (dev mode, key management)
    hapi-fhir:      # HAPI FHIR R4 server
    api:            # NestJS app
    web:            # Next.js app
    grafana:        # Monitoring dashboard
    prometheus:     # Metrics collector
    loki:           # Log aggregation
  ```
- [ ] Create `docker-compose.override.yml` for local dev (volume mounts, hot reload)
- [ ] Create `.env.example` with all required variables (no secrets hardcoded)
- [ ] Verify all services start and are healthy: `docker-compose ps`

**Output:**
- Full stack running locally with one command
- All services passing healthcheck

---

### 0.4 — Database Schema Design (FHIR R4-Aware)

> **CRITICAL:** Schema is the contract for the entire system. Every decision here affects everything downstream. Design with FHIR R4 resource mapping from day one.

**Tasks:**
- [ ] Draw complete ERD using dbdiagram.io or draw.io — validate before writing any code
- [ ] Create Prisma schema (`schema.prisma`) with all core tables:

#### Identity & Master Patient Index (MPI)
```prisma
model MpiRecord {
  id                String   @id @default(cuid())
  nik               String   @unique          // National ID (NIK)
  goldenName        String                    // Canonical/verified name
  dateOfBirth       DateTime
  gender            Gender
  addressProvince   String?
  addressCity       String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  version           Int      @default(1)

  patientIdentities PatientIdentity[]
  patients          Patient[]
}

model PatientIdentity {
  id          String   @id @default(cuid())
  mpiId       String
  system      String   // e.g. "bpjs", "hospital-local-id", "nik"
  value       String
  organizationId String?
  createdAt   DateTime @default(now())

  mpi         MpiRecord    @relation(fields: [mpiId], references: [id])
  organization Organization? @relation(fields: [organizationId], references: [id])

  @@unique([system, value])
}

model User {
  id             String    @id @default(cuid())
  keycloakId     String    @unique          // Keycloak user ID
  email          String    @unique
  role           UserRole
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  practitioner   Practitioner?
  patient        Patient?
}

model Patient {
  id          String    @id @default(cuid())
  userId      String    @unique
  mpiId       String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  version     Int       @default(1)

  user        User      @relation(fields: [userId], references: [id])
  mpi         MpiRecord @relation(fields: [mpiId], references: [id])
  encounters  Encounter[]
  consents    Consent[]
  allergies   AllergyIntolerance[]
}

model Practitioner {
  id             String   @id @default(cuid())
  userId         String   @unique
  strNumber      String   @unique          // Surat Tanda Registrasi
  specialization String?
  organizationId String
  isVerified     Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user           User         @relation(fields: [userId], references: [id])
  organization   Organization @relation(fields: [organizationId], references: [id])
  encounters     Encounter[]
}

model Organization {
  id           String           @id @default(cuid())
  name         String
  type         OrganizationType // HOSPITAL, CLINIC, PUSKESMAS
  parentId     String?
  province     String
  city         String
  isActive     Boolean          @default(true)
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  parent       Organization?    @relation("OrgHierarchy", fields: [parentId], references: [id])
  children     Organization[]   @relation("OrgHierarchy")
  practitioners Practitioner[]
}
```

#### Clinical Data
```prisma
model Encounter {
  id             String          @id @default(cuid())
  patientId      String
  practitionerId String
  organizationId String
  status         EncounterStatus // PLANNED, IN_PROGRESS, FINISHED, CANCELLED
  class          EncounterClass  // AMBULATORY, INPATIENT, EMERGENCY
  startDate      DateTime
  endDate        DateTime?
  chiefComplaint String?
  notes          String?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  version        Int             @default(1)

  patient        Patient         @relation(fields: [patientId], references: [id])
  practitioner   Practitioner    @relation(fields: [practitionerId], references: [id])
  conditions     Condition[]
  observations   Observation[]
  medicationReqs MedicationRequest[]
  procedures     Procedure[]
  documents      DocumentReference[]
}

model Condition {
  id              String          @id @default(cuid())
  encounterId     String
  icd10Code       String          // e.g. "J06.9"
  icd10Display    String          // e.g. "Acute upper respiratory infection"
  clinicalStatus  ClinicalStatus  // ACTIVE, RESOLVED, INACTIVE
  verificationStatus VerificationStatus // CONFIRMED, PROVISIONAL, DIFFERENTIAL
  onsetDate       DateTime?
  abatementDate   DateTime?
  notes           String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  encounter       Encounter       @relation(fields: [encounterId], references: [id])
}

model Observation {
  id          String   @id @default(cuid())
  encounterId String
  loincCode   String   // e.g. "8310-5" for body temperature
  loincDisplay String
  valueString String?
  valueNumber Decimal?
  valueUnit   String?
  status      ObservationStatus // FINAL, PRELIMINARY, AMENDED
  effectiveAt DateTime
  createdAt   DateTime @default(now())

  encounter   Encounter @relation(fields: [encounterId], references: [id])
}

model MedicationRequest {
  id              String    @id @default(cuid())
  encounterId     String
  medicationName  String
  medicationCode  String?   // e.g. BPOM/FORNAS code
  dosage          String
  frequency       String
  duration        String
  route           String    // ORAL, TOPICAL, INJECTION
  status          MedRequestStatus // ACTIVE, COMPLETED, CANCELLED
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  encounter       Encounter @relation(fields: [encounterId], references: [id])
}

model AllergyIntolerance {
  id              String        @id @default(cuid())
  patientId       String
  substance       String
  substanceCode   String?
  category        AllergyCategory // FOOD, MEDICATION, ENVIRONMENT
  criticality     AllergyCriticality // LOW, HIGH, UNABLE_TO_ASSESS
  reactionDesc    String?
  onsetDate       DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  patient         Patient       @relation(fields: [patientId], references: [id])
}

model Procedure {
  id           String    @id @default(cuid())
  encounterId  String
  snomedCode   String?
  display      String
  status       ProcedureStatus // COMPLETED, IN_PROGRESS, NOT_DONE
  performedAt  DateTime
  notes        String?
  createdAt    DateTime  @default(now())

  encounter    Encounter @relation(fields: [encounterId], references: [id])
}

model DocumentReference {
  id           String    @id @default(cuid())
  encounterId  String
  type         DocType   // LAB_RESULT, RADIOLOGY, CONSENT_FORM, OTHER
  title        String
  storageKey   String    // MinIO object key
  mimeType     String
  sizeBytes    Int
  isEncrypted  Boolean   @default(true)
  uploadedById String
  createdAt    DateTime  @default(now())

  encounter    Encounter @relation(fields: [encounterId], references: [id])
}
```

#### Consent & Audit
```prisma
model Consent {
  id              String        @id @default(cuid())
  patientId       String
  granteeType     GranteeType   // PRACTITIONER, ORGANIZATION
  granteeId       String
  scope           ConsentScope[] // READ_SUMMARY, READ_FULL, WRITE
  status          ConsentStatus  // ACTIVE, REVOKED, EXPIRED
  validFrom       DateTime
  validUntil      DateTime?
  grantedAt       DateTime      @default(now())
  revokedAt       DateTime?
  revokeReason    String?

  patient         Patient       @relation(fields: [patientId], references: [id])
}

// IMMUTABLE — never UPDATE or DELETE, only INSERT via trigger
model AuditEvent {
  id             String   @id @default(cuid())
  eventType      String   // READ, CREATE, UPDATE, DELETE, LOGIN, EXPORT, BREAK_GLASS
  resourceType   String   // Patient, Encounter, MedicationRequest, etc.
  resourceId     String
  actorId        String   // User ID
  actorRole      String
  ipAddress      String
  userAgent      String?
  isEmergency    Boolean  @default(false)
  metadata       Json?
  occurredAt     DateTime @default(now())

  @@index([resourceType, resourceId])
  @@index([actorId])
  @@index([occurredAt])
}

model EmergencyAccessLog {
  id             String   @id @default(cuid())
  patientId      String
  practitionerId String
  reason         String
  accessedAt     DateTime @default(now())
  notifiedAt     DateTime?
  supervisorId   String?
}
```

#### Enums
```prisma
enum UserRole           { PATIENT DOCTOR NURSE ADMIN AUDITOR SYSTEM }
enum Gender             { MALE FEMALE OTHER }
enum OrganizationType   { HOSPITAL CLINIC PUSKESMAS LABORATORY PHARMACY }
enum EncounterStatus    { PLANNED IN_PROGRESS FINISHED CANCELLED }
enum EncounterClass     { AMBULATORY INPATIENT EMERGENCY }
enum ClinicalStatus     { ACTIVE RESOLVED INACTIVE }
enum VerificationStatus { CONFIRMED PROVISIONAL DIFFERENTIAL }
enum ObservationStatus  { FINAL PRELIMINARY AMENDED }
enum MedRequestStatus   { ACTIVE COMPLETED CANCELLED STOPPED }
enum AllergyCategory    { FOOD MEDICATION ENVIRONMENT BIOLOGIC }
enum AllergyCriticality { LOW HIGH UNABLE_TO_ASSESS }
enum ProcedureStatus    { COMPLETED IN_PROGRESS NOT_DONE }
enum DocType            { LAB_RESULT RADIOLOGY CONSENT_FORM PRESCRIPTION OTHER }
enum GranteeType        { PRACTITIONER ORGANIZATION }
enum ConsentScope       { READ_SUMMARY READ_FULL WRITE }
enum ConsentStatus      { ACTIVE REVOKED EXPIRED }
```

- [ ] Run `prisma migrate dev --name init`
- [ ] Create SQL trigger for `AuditEvent` (append-only enforcement)
- [ ] Create seed script with dummy data:
  - 5 organizations (2 hospitals, 2 clinics, 1 puskesmas)
  - 20 practitioners (various specializations)
  - 100 patients with MPI records
  - 200 encounters with conditions, observations, medication requests
  - Sample allergy records, consent records, documents

**Output:**
- DB schema v1 with 100% FK constraints enforced
- Seed data runnable with `make seed`
- ERD diagram committed to `/docs/schema/`

---

### 0.5 — CI/CD Foundation

**Tasks:**
- [ ] Create GitHub Actions workflow: `.github/workflows/ci.yml`
  ```yaml
  # Triggers on: push to develop, pull_request to main
  jobs:
    lint:     # ESLint + Prettier check
    test:     # Unit + integration tests
    build:    # Build all apps
    security: # npm audit + basic SAST
  ```
- [ ] Add branch protection on `main`: require PR + passing CI
- [ ] Setup Dependabot for automatic dependency updates

**Output:**
- Every push auto-triggers lint + test + build
- Failed CI blocks merge to main

---

## PHASE 1 — CORE BACKEND + SECURITY LAYER
**Duration:** 6–8 weeks  
**Goal:** Production-grade authentication, core REST API for all clinical entities, encryption active, audit logging live.

---

### 1.1 — NestJS App Bootstrap

**Tasks:**
- [ ] Initialize NestJS app inside `apps/api/`
- [ ] Setup module structure:
  ```
  src/
  ├── modules/
  │   ├── auth/
  │   ├── patients/
  │   ├── practitioners/
  │   ├── organizations/
  │   ├── encounters/
  │   ├── conditions/
  │   ├── observations/
  │   ├── medications/
  │   ├── allergies/
  │   ├── documents/
  │   ├── consents/
  │   └── audit/
  ├── common/
  │   ├── decorators/
  │   ├── guards/
  │   ├── interceptors/   # logging, response transform
  │   ├── filters/        # global exception filter
  │   ├── pipes/          # global validation pipe
  │   └── middleware/
  ├── config/             # typed config with @nestjs/config
  ├── database/           # Prisma service + module
  └── main.ts
  ```
- [ ] Setup global pipes: `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true`
- [ ] Setup global exception filter: standardized error response format
- [ ] Setup global interceptor: response transform to `{ data, meta, timestamp }`
- [ ] Setup Swagger `@nestjs/swagger`: auto-generate API docs at `/api/docs`
- [ ] Setup `@nestjs/config` with typed config schema (Zod-validated env vars)
- [ ] Setup Prisma service with connection pooling config

**Output:**
- `GET /health` returns `{ status: "ok", db: "connected", redis: "connected" }`
- Swagger UI accessible at `localhost:3000/api/docs`

---

### 1.2 — Authentication via Keycloak

**Tasks:**
- [ ] Configure Keycloak realm: `ehr-system`
- [ ] Create Keycloak clients:
  - `ehr-api` (confidential, for backend validation)
  - `ehr-web` (public, for Next.js)
  - `ehr-mobile` (public, for React Native)
- [ ] Define Keycloak roles: `PATIENT`, `DOCTOR`, `NURSE`, `ADMIN`, `AUDITOR`
- [ ] Implement `JwtAuthGuard` in NestJS — validate JWT against Keycloak public key (JWKS)
- [ ] Implement `RolesGuard` — check role from JWT claims
- [ ] Implement `@CurrentUser()` decorator — extract user from request
- [ ] Implement `OrganizationGuard` — verify doctor belongs to same organization as patient (ABAC)
- [ ] Setup MFA TOTP in Keycloak — required for `DOCTOR` and `ADMIN` roles
- [ ] Implement refresh token rotation with Redis blacklist (token revocation)
- [ ] Implement `POST /auth/logout` — blacklist current refresh token in Redis

**Token Flow:**
```
Client → POST /auth/login → Keycloak → access_token (15min) + refresh_token (7d)
Client → API request with Authorization: Bearer <access_token>
NestJS JwtAuthGuard → validate signature + expiry via JWKS endpoint
NestJS RolesGuard → check role claim
NestJS OrganizationGuard → check organization access (ABAC)
```

**Output:**
- Login returns valid JWT
- Protected endpoints reject invalid/expired tokens with 401
- Role-based access works: doctor cannot access admin endpoints
- ABAC works: doctor A cannot access patients of organization B without consent

---

### 1.3 — Core REST API

**For each module, implement:**
- DTO (Data Transfer Object) with Zod schema in `packages/shared`
- Service with business logic
- Controller with Swagger decorators
- Unit tests (>80% coverage)
- Integration tests with test database

#### Patients Module
- [ ] `POST /patients` — register patient, create MPI record or link to existing
- [ ] `GET /patients` — paginated list (admin/doctor only), with search by name/NIK
- [ ] `GET /patients/:id` — patient profile + active allergies + latest vitals
- [ ] `PATCH /patients/:id` — update demographic info
- [ ] `GET /patients/:id/timeline` — full medical history sorted by date

#### Practitioners Module
- [ ] `POST /practitioners` — register practitioner with STR validation
- [ ] `GET /practitioners/:id` — practitioner profile
- [ ] `PATCH /practitioners/:id/verify` — admin marks STR as verified

#### Organizations Module
- [ ] `POST /organizations` — create organization
- [ ] `GET /organizations` — list with hierarchy
- [ ] `GET /organizations/:id` — org detail with practitioners

#### Encounters Module
- [ ] `POST /encounters` — create new encounter (doctor only, for their org's patients)
- [ ] `GET /encounters/:id` — encounter detail with all clinical data
- [ ] `PATCH /encounters/:id` — update encounter (only by owning practitioner)
- [ ] `PATCH /encounters/:id/finish` — close encounter

#### Clinical Sub-resources (nested under encounters)
- [ ] `POST /encounters/:id/conditions`
- [ ] `POST /encounters/:id/observations`
- [ ] `POST /encounters/:id/medications` (check allergy before saving — return warning if conflict)
- [ ] `POST /encounters/:id/procedures`
- [ ] `GET` versions for all above

#### Allergies Module
- [ ] `POST /patients/:id/allergies`
- [ ] `GET /patients/:id/allergies`
- [ ] `DELETE /patients/:id/allergies/:allergyId`

**Output:**
- All endpoints documented in Swagger
- Postman/REST Client collection committed to `/docs/api/`
- API returns consistent error format for validation failures

---

### 1.4 — Security Implementation

**Tasks:**
- [ ] Setup HashiCorp Vault in Docker (dev mode)
- [ ] Store all secrets in Vault: DB password, MinIO credentials, Keycloak client secret
- [ ] Implement field-level encryption for sensitive columns: NIK, phone number, date of birth
  - Use AES-256-GCM with key fetched from Vault
  - Encrypt before Prisma write, decrypt after Prisma read
  - Implement as Prisma middleware
- [ ] Configure NGINX as reverse proxy with:
  - TLS 1.3 (HTTPS only, redirect HTTP → HTTPS)
  - Security headers: `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Content-Security-Policy`
  - Rate limiting: 100 req/min per IP globally, 10 req/min for auth endpoints
- [ ] Setup ClamAV container, integrate file scan before saving to MinIO
- [ ] Global NestJS input sanitization: strip HTML tags, prevent XSS
- [ ] Implement `IDOR protection`: every query scoped to authenticated user's accessible resources

**Output:**
- Attempt to access another user's data returns 403 (not 404)
- File upload with EICAR test virus is rejected
- All secrets loaded from Vault/env, zero hardcoded credentials in codebase

---

### 1.5 — Audit Logging System

**Tasks:**
- [ ] Implement `AuditInterceptor` in NestJS — fires on every write operation (POST/PATCH/DELETE)
- [ ] Implement audit log for read operations on sensitive data (patient records, documents)
- [ ] Create PostgreSQL trigger to prevent UPDATE/DELETE on `audit_events` table:
  ```sql
  CREATE OR REPLACE FUNCTION prevent_audit_modification()
  RETURNS TRIGGER AS $$
  BEGIN
    RAISE EXCEPTION 'Audit events are immutable';
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER audit_immutable
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
  ```
- [ ] Setup Pino structured logging with correlation ID (UUID per request, passed via `X-Correlation-ID` header)
- [ ] Configure Loki log collector + Grafana dashboard for log search

**Output:**
- Every clinical data mutation has a corresponding audit_event record
- Attempt to UPDATE/DELETE audit_events raises DB exception
- Logs searchable in Grafana Loki dashboard

---

### 1.6 — Monitoring Setup

**Tasks:**
- [ ] Configure Prometheus to scrape NestJS metrics (`/metrics` endpoint via `nestjs-prometheus`)
- [ ] Create Grafana dashboards:
  - API response time (p50, p95, p99)
  - Error rate by endpoint
  - DB query performance
  - Active connections
- [ ] Setup Uptime Kuma: monitor all services, alert via Telegram/email if down
- [ ] Setup Sentry in NestJS: auto-capture unhandled exceptions with full context

**Output:**
- Grafana dashboard shows real-time system health
- Sentry receives test error and shows full stack trace

---

## PHASE 2 — FRONTEND + CLINICAL FEATURES
**Duration:** 6–8 weeks  
**Goal:** Full working web dashboard for doctors and admins. Patient portal. Consent management. End-to-end demo ready for stakeholders.

---

### 2.1 — Next.js App Bootstrap

**Tasks:**
- [ ] Initialize Next.js 14 with App Router in `apps/web/`
- [ ] Setup folder structure:
  ```
  src/
  ├── app/
  │   ├── (auth)/           # Login, callback pages
  │   ├── (dashboard)/
  │   │   ├── patients/
  │   │   ├── encounters/
  │   │   ├── admin/
  │   │   └── audit/
  │   └── api/              # Next.js API routes (BFF if needed)
  ├── components/
  │   ├── ui/               # shadcn/ui base components
  │   ├── forms/            # React Hook Form + Zod forms
  │   ├── tables/           # TanStack Table wrappers
  │   └── charts/           # Recharts wrappers
  ├── lib/
  │   ├── api/              # API client (typed, using shared Zod schemas)
  │   ├── auth/             # Keycloak client config
  │   └── utils/
  └── stores/               # Zustand stores
  ```
- [ ] Configure Keycloak auth via `next-auth` with Keycloak provider
- [ ] Setup React Query (`TanStack Query`) — all API calls via query/mutation hooks
- [ ] Setup Zustand for: auth state, UI state (sidebar, modals)
- [ ] Create API client in `lib/api/` — typed wrappers using Zod schemas from `packages/shared`

**Output:**
- Login page redirects to Keycloak, callback sets session, protected routes redirect unauthenticated users

---

### 2.2 — Doctor Dashboard

**Tasks:**

#### Patient Search & Profile
- [ ] Patient search page: searchbar with debounce (300ms), results paginated with TanStack Table
- [ ] Search by: name, NIK, BPJS number, MPI ID
- [ ] Patient profile page: demographics, active allergies (with severity badges), latest vitals summary
- [ ] Patient medical timeline: chronological list of encounters with expandable detail

#### Encounter Management
- [ ] New encounter form: select patient, set class (ambulatory/inpatient/emergency), chief complaint
- [ ] Active encounter workspace:
  - Vital signs section: input with unit labels (°C, mmHg, bpm, kg)
  - Diagnosis section: ICD-10 autocomplete search (use pre-loaded ICD-10 JSON)
  - Observation notes: free-text SOAP notes
  - Medication prescribing: drug name, dosage, frequency, duration
  - **Allergy alert**: if prescribed drug matches any patient allergy — show warning modal (cannot dismiss without confirming acknowledgment)
  - Procedures performed: procedure name + SNOMED code search
- [ ] Document upload: drag-and-drop, show upload progress, type selection
- [ ] Finish encounter: confirmation modal, encounter locked after finish

**Output:**
- Doctor can complete a full encounter workflow in < 5 minutes
- Allergy alert fires correctly when tested with conflicting drug/allergy data

---

### 2.3 — Patient Portal (Web)

**Tasks:**
- [ ] Dashboard: greeting, upcoming appointments, last visit summary
- [ ] Health timeline: visual timeline of all encounters, grouped by year
- [ ] Encounter detail: read-only view of diagnosis, medications, observations
- [ ] Consent management page:
  - List of active consents (who has access, what scope, until when)
  - Revoke consent button (with confirmation modal)
  - Pending consent requests (approve / reject)
- [ ] Document viewer: list of uploaded documents, preview PDF in-browser, download button
- [ ] Profile page: view and update contact information

**Output:**
- Patient can see all their medical history
- Patient can revoke a consent and doctor immediately loses access

---

### 2.4 — Admin Panel

**Tasks:**
- [ ] User management: list all users, filter by role, suspend/activate, reset password (trigger Keycloak action)
- [ ] Organization management: create/edit org, assign practitioners, view hierarchy tree
- [ ] Audit log viewer: searchable table with filters (user, resource type, date range, event type)
- [ ] System health page: embed Grafana dashboard iframe (read-only)
- [ ] STR verification queue: list unverified practitioners, verify/reject with notes

**Output:**
- Admin can manage all users and organizations without touching the database directly

---

### 2.5 — Consent & Emergency Access Protocol

**Tasks:**

#### Normal Consent Flow
- [ ] `POST /consents` — practitioner requests access to patient
- [ ] Patient receives in-app notification (polling or WebSocket)
- [ ] Patient reviews request: see who, what scope, for how long
- [ ] Patient approves/rejects → practitioner immediately granted/denied access
- [ ] Consent has expiry — auto-revoke at `validUntil` (daily cron job)

#### Break-Glass Emergency Access
- [ ] `POST /consents/emergency` — available only to `DOCTOR` in `EMERGENCY` encounter class
- [ ] Required fields: `patientId`, `reason` (minimum 50 chars), `emergencyEncounterId`
- [ ] Bypass consent check — full read access granted for duration of encounter
- [ ] Immediately creates `EmergencyAccessLog` record
- [ ] Sends notification to: patient (async, deferred if unconscious), patient's organization admin, supervisor (if configured)
- [ ] All data accessed via break-glass is tagged in audit_events with `isEmergency: true`
- [ ] Patient can view all break-glass accesses in their portal

**Output:**
- Full end-to-end demo can be presented to stakeholders
- Both normal consent and emergency flows demonstrated with real UI

---

## PHASE 3 — MOBILE APP + OFFLINE CAPABILITY
**Duration:** 4–6 weeks  
**Goal:** Patient-facing mobile app with offline access to medical records and background sync.

---

### 3.1 — React Native App Bootstrap

**Tasks:**
- [ ] Initialize Expo app with TypeScript in `apps/mobile/`
- [ ] Setup Expo Router for file-based navigation
- [ ] Configure Keycloak auth via `expo-auth-session` (OAuth2 PKCE flow)
- [ ] Setup WatermelonDB for local SQLite storage
- [ ] Setup React Query with persistence adapter (persist cache to WatermelonDB)
- [ ] Setup Expo Notifications (local + push)
- [ ] Setup Expo SecureStore for storing auth tokens (not AsyncStorage — SecureStore is encrypted)

**WatermelonDB Schema (local):**
```javascript
// Local tables that mirror server data
tableSchema({ name: 'patients', columns: [...] })
tableSchema({ name: 'encounters', columns: [...] })
tableSchema({ name: 'conditions', columns: [...] })
tableSchema({ name: 'medications', columns: [...] })
tableSchema({ name: 'observations', columns: [...] })
tableSchema({ name: 'consents', columns: [...] })
tableSchema({ name: 'sync_metadata', columns: [
  { name: 'last_pulled_at', type: 'number' },
  { name: 'last_pushed_at', type: 'number' },
]})
```

**Output:**
- App runs on iOS Simulator and Android Emulator
- Login via Keycloak works on mobile

---

### 3.2 — Core Screens

**Tasks:**
- [ ] **Home screen**: last visit summary, active medications, upcoming schedule
- [ ] **Timeline screen**: chronological encounter list, pull-to-refresh
- [ ] **Encounter detail screen**: full clinical data, offline readable
- [ ] **Documents screen**: list of uploaded documents, download for offline viewing
- [ ] **Consents screen**: manage active consents, approve/reject pending requests
- [ ] **Notifications screen**: history of all notifications
- [ ] **Profile screen**: demographics, allergy list
- [ ] Biometric authentication: `expo-local-authentication` (fingerprint/face ID) as shortcut after initial login

**Output:**
- Patient can view their entire medical history offline after first sync

---

### 3.3 — Offline Sync Engine

**Tasks:**
- [ ] Implement delta sync: only sync records changed since `last_pulled_at`
- [ ] Backend sync endpoint: `GET /sync/pull?since=<timestamp>&userId=<id>` — returns changed records
- [ ] Conflict resolution strategy:
  - **Non-clinical data** (profile, contact): last-write-wins based on `updatedAt`
  - **Clinical data** (diagnosis, medications): NEVER auto-resolve — flag conflict, require practitioner review via API
  - Track `version` field on every record for optimistic concurrency
- [ ] Background sync: use `expo-background-fetch` — sync every 15 minutes when app is backgrounded
- [ ] Sync status indicator in UI: "Synced 2 minutes ago" / "Offline — last synced 3 hours ago"
- [ ] Queue mutations when offline, auto-push when connection restored

**Output:**
- App functions fully offline
- No data loss when going offline mid-session
- Sync resolves cleanly when connection restores

---

## PHASE 4 — FHIR INTEROPERABILITY + EXTERNAL INTEGRATION
**Duration:** 4–6 weeks  
**Goal:** Expose FHIR R4 compliant API, integrate with external systems (BPJS, lab, pharmacy) via mock servers.

---

### 4.1 — HAPI FHIR Server Setup

**Tasks:**
- [ ] Deploy HAPI FHIR R4 server via Docker (already in docker-compose from Phase 0)
- [ ] Configure HAPI to use same PostgreSQL instance (separate schema: `fhir_store`)
- [ ] Create bidirectional FHIR mappers in `packages/fhir/`:
  ```typescript
  // Internal model → FHIR Resource
  mapPatientToFhir(patient: Patient): fhir4.Patient
  mapEncounterToFhir(encounter: Encounter): fhir4.Encounter
  mapConditionToFhir(condition: Condition): fhir4.Condition
  mapObservationToFhir(observation: Observation): fhir4.Observation
  mapMedicationRequestToFhir(med: MedicationRequest): fhir4.MedicationRequest
  mapAllergyToFhir(allergy: AllergyIntolerance): fhir4.AllergyIntolerance

  // FHIR Resource → Internal model
  mapFhirToPatient(resource: fhir4.Patient): CreatePatientDto
  mapFhirToEncounter(resource: fhir4.Encounter): CreateEncounterDto
  // etc.
  ```
- [ ] Implement sync job: after every clinical write, async push FHIR resource to HAPI server via BullMQ
- [ ] Expose FHIR endpoints (proxied via NestJS):
  - `GET /fhir/Patient/:id`
  - `GET /fhir/Patient/:id/$everything` (all clinical data for patient)
  - `GET /fhir/Encounter/:id`
  - `GET /fhir/Observation?patient=:id&category=vital-signs`
  - `POST /fhir/Bundle` (batch import)
- [ ] Validate FHIR resources using `fhir-validator-npm` before storing
- [ ] Test all FHIR resources against official FHIR validator: https://validator.fhir.org/

**Output:**
- FHIR R4 API passes validation
- External system can query patient data via FHIR without knowing internal DB schema

---

### 4.2 — External Integrations (Mock Servers)

> All external integrations use mock servers in dev/staging. Real integration only in production pilot.

**Tasks:**

#### BPJS Integration
- [ ] Create mock BPJS server (NestJS or JSON Server): `GET /bpjs/peserta/:bpjsNumber`
- [ ] Implement `BpjsService` in NestJS: validate BPJS membership on patient registration
- [ ] Show BPJS status badge on patient profile (Active / Inactive / Not Found)
- [ ] Store BPJS number in `patient_identities` table

#### Laboratory Integration
- [ ] Create mock lab server with webhook: `POST /lab/results` pushes result to our system
- [ ] Implement webhook receiver: validate signature, create `Observation` records, upload PDF to MinIO
- [ ] Notify doctor via in-app notification when lab result arrives for their patient

#### Pharmacy Integration
- [ ] Create mock pharmacy server
- [ ] `POST /pharmacy/prescriptions` — send prescription from our system to pharmacy
- [ ] Pharmacy sends back: `{ status: "dispensed", dispensedAt, pharmacistName }`
- [ ] Update `MedicationRequest.status` to `COMPLETED` on dispensation

**Output:**
- Full integration flow demonstrable with mock servers
- Easy to swap mock → real when going to production

---

### 4.3 — Legacy Data Bridge

**Tasks:**
- [ ] Create ETL script (`/scripts/migrate-legacy.ts`) to import from:
  - CSV format (common SIMRS export)
  - XML format (HL7 v2 messages, common in older RS)
- [ ] Data validation pipeline:
  - Validate NIK format (16 digits)
  - Normalize name casing, remove extra whitespace
  - Map old diagnosis codes to ICD-10
  - Deduplicate patients using MPI matching algorithm
- [ ] **MPI Probabilistic Matching Algorithm:**
  - Exact match on NIK → highest confidence
  - Fuzzy match on: normalized name + date of birth + gender → medium confidence
  - Low confidence matches go to manual review queue
  - Create `potential_duplicates` table for human review
- [ ] Dry-run mode: show what would be imported without actually writing to DB
- [ ] Import report: total records, successful, failed, duplicates detected

**Output:**
- Can import 1000 dummy legacy patient records with <1% error rate

---

## PHASE 5 — PERFORMANCE, SECURITY AUDIT & PRODUCTION READINESS
**Duration:** 4–6 weeks  
**Goal:** System is hardened, load-tested, documented, and ready for real pilot deployment.

---

### 5.1 — Database Optimization

**Tasks:**
- [ ] Enable `pg_stat_statements` — identify slow queries
- [ ] Add indexes based on actual query patterns (not speculation):
  ```sql
  -- Common queries that need indexes
  CREATE INDEX idx_encounters_patient_id ON encounters(patient_id);
  CREATE INDEX idx_encounters_practitioner_id ON encounters(practitioner_id);
  CREATE INDEX idx_encounters_created_at ON encounters(created_at DESC);
  CREATE INDEX idx_audit_events_actor_id ON audit_events(actor_id);
  CREATE INDEX idx_audit_events_resource ON audit_events(resource_type, resource_id);
  CREATE INDEX idx_conditions_icd10 ON conditions(icd10_code);
  CREATE INDEX idx_observations_loinc ON observations(loinc_code);
  -- Full-text search
  CREATE INDEX idx_patients_search ON patients USING gin(to_tsvector('indonesian', name));
  ```
- [ ] Setup PgBouncer for connection pooling (pool_mode: transaction)
- [ ] Analyze and fix all N+1 queries (use Prisma `include` carefully, add DataLoader where needed)
- [ ] Setup DB read replica for analytics/audit queries (separate from write DB)

**Output:**
- p95 API response time < 200ms under normal load
- No N+1 queries in doctor dashboard (verified via query logging)

---

### 5.2 — Load Testing

**Tasks:**
- [ ] Write k6 test scenarios:
  ```javascript
  // Scenario 1: Doctor workflow
  // 100 concurrent doctors, each: login → search patient → open encounter → submit

  // Scenario 2: Patient portal
  // 500 concurrent patients, each: login → view timeline → view document

  // Scenario 3: Admin dashboard
  // 10 concurrent admins viewing audit logs with heavy filters
  ```
- [ ] Run load tests against staging environment
- [ ] Target thresholds:
  - p95 response time < 500ms
  - Error rate < 0.1%
  - System stable at 500 concurrent users
- [ ] Fix all bottlenecks identified by load test before proceeding

**Output:**
- Load test report committed to `/docs/performance/`
- System stable at 500 concurrent users

---

### 5.3 — Security Audit

**Tasks:**
- [ ] Run OWASP ZAP automated scan against all API endpoints
- [ ] Manual test for OWASP Top 10:
  - [ ] A01 Broken Access Control: test IDOR on all patient/encounter endpoints
  - [ ] A02 Cryptographic Failures: verify all sensitive fields are encrypted at rest
  - [ ] A03 Injection: test SQL injection on all search/filter inputs
  - [ ] A04 Insecure Design: review consent bypass scenarios
  - [ ] A05 Security Misconfiguration: check all security headers, default credentials removed
  - [ ] A07 Auth Failures: test token replay, brute force on login
  - [ ] A09 Logging Failures: verify all security events are logged
- [ ] Scan all npm dependencies: `npm audit` + Snyk scan
- [ ] Review Vault configuration: ensure dev mode is NOT used in production
- [ ] Create security findings report with severity rating
- [ ] Remediate all Critical and High findings before pilot

**Output:**
- Security report with zero Critical or High unresolved findings

---

### 5.4 — Disaster Recovery

**Tasks:**
- [ ] Setup automated daily PostgreSQL backup to MinIO:
  ```bash
  # Cron: 2:00 AM daily
  pg_dump ehr_production | gzip | mc pipe minio/backups/$(date +%Y-%m-%d).sql.gz
  ```
- [ ] Test restore procedure: restore from backup to separate DB, verify data integrity
- [ ] Define and document:
  - **RTO (Recovery Time Objective):** maximum 4 hours downtime
  - **RPO (Recovery Point Objective):** maximum 1 hour data loss
- [ ] Setup PostgreSQL streaming replication (primary + 1 standby)
- [ ] Setup automatic failover: Patroni or pg_auto_failover
- [ ] Write and test runbooks for common incidents:
  - Database primary failure
  - Disk full
  - API service crash loop
  - Redis connection loss
  - MinIO unavailable

**Output:**
- Successful restore drill completed and documented
- Runbooks committed to `/docs/runbooks/`

---

### 5.5 — Final Documentation

**Tasks:**
- [ ] Swagger/OpenAPI spec complete and accurate for all endpoints
- [ ] Architecture Decision Records (ADRs) for major decisions:
  - Why NestJS over Express
  - Why Keycloak over custom auth
  - Why monorepo with Turborepo
  - Why FHIR R4 in schema from day one
  - Why WatermelonDB for mobile offline
- [ ] Data dictionary: every table, every column, data type, constraints, description
- [ ] Deployment guide: step-by-step instructions to deploy to fresh server
- [ ] Developer onboarding guide: from zero to running local dev in < 30 minutes
- [ ] User manual (basic): for doctors and patients

**Output:**
- New developer can onboard in < 30 minutes following README
- System ready for pilot deployment at real healthcare facility

---

## APPENDIX A — ONGOING (ALL PHASES)

### Testing Standards
- Unit test coverage: minimum **80%** for all modules
- Integration tests: all API endpoints must have at least one happy-path and one error-path test
- Test database: separate `ehr_test` database, wiped and re-seeded before each test run
- Naming convention: `describe('ModuleName') > it('should [expected behavior] when [condition]')`

### Git Workflow
```
main          ← production-ready only, protected
develop       ← integration branch
feature/*     ← new features, branch from develop
fix/*         ← bug fixes
hotfix/*      ← urgent production fixes, branch from main
```

### Commit Message Format (Conventional Commits)
```
feat(patients): add MPI deduplication on registration
fix(auth): resolve token refresh race condition
docs(schema): add ERD diagram for Phase 0
test(encounters): add integration test for allergy alert
chore(deps): upgrade prisma to 5.10.0
```

---

## APPENDIX B — ENVIRONMENT VARIABLES REFERENCE

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ehr_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://localhost:6379

# Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=ehr-system
KEYCLOAK_CLIENT_ID=ehr-api
KEYCLOAK_CLIENT_SECRET=<from-vault>

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=<from-vault>
MINIO_SECRET_KEY=<from-vault>
MINIO_BUCKET_DOCUMENTS=ehr-documents

# HashiCorp Vault
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=<dev-root-token>

# HAPI FHIR
HAPI_FHIR_URL=http://localhost:8090/fhir

# App
NODE_ENV=development
PORT=3000
JWT_ISSUER=http://localhost:8080/realms/ehr-system
CORS_ORIGINS=http://localhost:3001,http://localhost:3002
```

---

## APPENDIX C — SUMMARY TABLE

| Phase | Name | Duration | Key Deliverable |
|-------|------|----------|-----------------|
| 0 | Foundation & Schema | 4–6 wks | Monorepo, Docker stack, FHIR-aware DB schema |
| 1 | Core Backend + Security | 6–8 wks | Auth (Keycloak), REST API, Encryption, Audit log |
| 2 | Frontend + Clinical | 6–8 wks | Doctor dashboard, Patient portal, Consent flow |
| 3 | Mobile + Offline | 4–6 wks | React Native app, WatermelonDB sync |
| 4 | FHIR + Integration | 4–6 wks | HAPI FHIR API, BPJS/lab/pharmacy mock integration |
| 5 | Production Ready | 4–6 wks | Load test, security audit, DR, full docs |
| **Total** | | **~14–18 months** | **System ready for real pilot** |