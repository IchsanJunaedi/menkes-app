# PROJECT CONTEXT

## Roadmap
Baca file `roadmap.md` sebelum mengerjakan apapun.
File ini berisi seluruh arsitektur, schema database, tech stack, dan urutan pengerjaan sistem EHR Nasional Indonesia.

## Aturan Wajib
- Selalu cek phase mana yang sedang aktif sebelum mulai coding
- Jangan skip atau ubah urutan phase tanpa konfirmasi
- Semua keputusan teknis harus konsisten dengan tech stack di roadmap
- Jika ragu, tanya dulu jangan langsung implement

## Phase Saat Ini
**PHASE 0** — Environment, Foundation & Schema Design

## Stack Utama
- Backend: NestJS + TypeScript + Prisma + PostgreSQL
- Frontend: Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui
- Mobile: React Native Expo
- Auth: Keycloak
- Storage: MinIO
- Cache: Redis
- FHIR: HAPI FHIR R4
```

---

## 3. Prompt pembuka yang tepat saat mulai sesi

Setiap kali mulai sesi baru, ketik ini:
```
Read roadmap.md completely, then tell me:
1. What phase are we on
2. What tasks are done (checked) vs pending
3. What should we work on next
```

Claude Code akan baca file-nya, lalu kasih summary status — dari situ kamu tinggal bilang *"oke lanjut task berikutnya"*.

---

## 4. Saat mau mulai task spesifik
```
Based on EHR_ROADMAP_PHASES.md, implement Phase 0.4 — 
the Prisma schema for MPI and Patient Identity tables.
Follow the schema exactly as written in the roadmap.