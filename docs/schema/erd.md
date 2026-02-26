# Database Entity-Relationship Diagram (ERD)

This represents the schema layout for the SehatKu EHR platform based on FHIR R4 mapping.

```mermaid
erDiagram
    User ||--o| Practitioner : "1:1 has"
    User ||--o| Patient : "1:1 has"
    MpiRecord ||--|{ Patient : "1:N instance"
    MpiRecord ||--|{ PatientIdentity : "1:N has"
    Organization ||--o{ Organization : "1:N hierarchy"
    Organization ||--|{ Practitioner : "1:N employs"
    Organization ||--o{ PatientIdentity : "1:N issues"

    Patient ||--|{ Encounter : "1:N undergoes"
    Patient ||--o{ Consent : "1:N grants"
    Patient ||--o{ AllergyIntolerance : "1:N has"

    Practitioner ||--|{ Encounter : "1:N performs"

    Encounter ||--o{ Condition : "1:N diagnoses"
    Encounter ||--o{ Observation : "1:N measures"
    Encounter ||--o{ MedicationRequest : "1:N prescribes"
    Encounter ||--o{ Procedure : "1:N executes"
    Encounter ||--o{ DocumentReference : "1:N records"

    Consent ||--o{ Grantee : "grants access to"
    EmergencyAccessLog ||--|| Patient : "accesses"
```

## Schema Entities (PostgreSQL via Prisma)

- **Identity & MPI Domain:** User, Patient, MpiRecord, PatientIdentity, Practitioner, Organization
- **Clinical Domain:** Encounter, Condition, Observation, Procedure, MedicationRequest, AllergyIntolerance, DocumentReference
- **Audit & Security:** Consent, AuditEvent, EmergencyAccessLog
