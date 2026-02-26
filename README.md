# SehatKu — Sistem Rekam Medis Digital Nasional Indonesia

> National Electronic Health Record (EHR) System  
> A production-grade, FHIR R4-aware EHR platform built for Indonesia's healthcare infrastructure.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS + TypeScript + Prisma + PostgreSQL |
| Frontend | Next.js 14 App Router + Tailwind + shadcn/ui |
| Mobile | React Native Expo |
| Auth | Keycloak 24 |
| Storage | MinIO (S3-compatible) |
| Cache | Redis 7 |
| FHIR | HAPI FHIR R4 |
| Monitoring | Grafana + Prometheus + Loki |

---

## Project Structure

```
/
├── apps/
│   ├── api/          # NestJS backend
│   ├── web/          # Next.js doctor/admin dashboard
│   └── mobile/       # React Native Expo patient app
├── packages/
│   ├── shared/       # Zod schemas, TypeScript types, constants
│   ├── fhir/         # FHIR R4 mappers and resource types
│   └── ui/           # Shared UI components
├── infra/
│   ├── docker/       # Dockerfiles per service
│   └── k8s/          # Kubernetes manifests (production)
└── docs/
    ├── adr/          # Architecture Decision Records
    ├── schema/       # ERD diagrams
    └── api/          # API documentation
```

---

## Getting Started

### Prerequisites

- Node.js >= 20
- Docker Desktop
- Git

### Setup

```bash
# 1. Clone the repo
git clone git@github.com:<org>/sehatku-ehr.git
cd sehatku-ehr

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env
# Edit .env with your local values

# 4. Start Docker services (DB, Redis, Keycloak, MinIO, etc.)
make dev-docker

# 5. Run database migrations and seed
make migrate
make seed

# 6. Start all apps
make dev
```

### Available Commands

```bash
make dev          # Start all services
make test         # Run all tests
make migrate      # Run DB migrations
make seed         # Seed dummy data
make lint         # Lint all packages
make build        # Build all apps
make help         # Show all commands
```

---

## Development Phases

| Phase | Name | Status |
|-------|------|--------|
| 0 | Foundation & Schema | 🔄 In Progress |
| 1 | Core Backend + Security | ⏳ Pending |
| 2 | Frontend + Clinical Features | ⏳ Pending |
| 3 | Mobile + Offline | ⏳ Pending |
| 4 | FHIR + Integrations | ⏳ Pending |
| 5 | Production Readiness | ⏳ Pending |

---

## Contributing

- Branch from `develop` for features: `feature/your-feature`
- Follow [Conventional Commits](https://www.conventionalcommits.org/)
- All PRs require passing CI before merge to `main`

---

*Developed for Indonesia's national healthcare interoperability initiative.*
