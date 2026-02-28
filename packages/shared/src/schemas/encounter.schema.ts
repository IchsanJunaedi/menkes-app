import { z } from 'zod';

export const CreateEncounterDtoSchema = z.object({
    patientId: z.string().cuid("Invalid Patient ID"),
    practitionerId: z.string().cuid("Invalid Practitioner ID"),
    organizationId: z.string().cuid("Invalid Organization ID"),
    status: z.enum(['PLANNED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED']).default('PLANNED'),
    class: z.enum(['AMBULATORY', 'INPATIENT', 'EMERGENCY']),
    startDate: z.string().datetime("Valid ISO8601 start date required"),
    endDate: z.string().datetime().nullable().optional(),
    chiefComplaint: z.string().min(5, "Chief complaint must be described").optional(),
    notes: z.string().optional(),
});

export const UpdateEncounterDtoSchema = CreateEncounterDtoSchema.omit({
    patientId: true,
    practitionerId: true,
    organizationId: true
}).partial();

// Sub-Resource DTOs mapping Clinical Nodes structurally inside an encounter

export const ConditionDtoSchema = z.object({
    icd10Code: z.string().min(3),
    icd10Display: z.string().min(3),
    clinicalStatus: z.enum(['ACTIVE', 'RESOLVED', 'INACTIVE']),
    verificationStatus: z.enum(['CONFIRMED', 'PROVISIONAL', 'DIFFERENTIAL']),
    onsetDate: z.string().datetime().optional(),
    notes: z.string().optional(),
});

export const ObservationDtoSchema = z.object({
    loincCode: z.string().min(3),
    loincDisplay: z.string().min(3),
    valueString: z.string().optional(),
    valueNumber: z.number().optional(),
    valueUnit: z.string().optional(),
    status: z.enum(['FINAL', 'PRELIMINARY', 'AMENDED']).default('FINAL'),
    effectiveAt: z.string().datetime(),
});

export const MedicationRequestDtoSchema = z.object({
    medicationName: z.string().min(2),
    medicationCode: z.string().optional(),
    dosage: z.string().min(1),
    frequency: z.string().min(1),
    duration: z.string().min(1),
    route: z.string().min(1),  // ORAL, TOPICAL, INJECTION
    status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED', 'STOPPED']).default('ACTIVE'),
    notes: z.string().optional(),
});

export const ProcedureDtoSchema = z.object({
    snomedCode: z.string().optional(),
    display: z.string().min(3),
    status: z.enum(['COMPLETED', 'IN_PROGRESS', 'NOT_DONE']).default('COMPLETED'),
    performedAt: z.string().datetime(),
    notes: z.string().optional(),
});

// Type Extraction 
export type CreateEncounterDto = z.infer<typeof CreateEncounterDtoSchema>;
export type UpdateEncounterDto = z.infer<typeof UpdateEncounterDtoSchema>;
export type ConditionDto = z.infer<typeof ConditionDtoSchema>;
export type ObservationDto = z.infer<typeof ObservationDtoSchema>;
export type MedicationRequestDto = z.infer<typeof MedicationRequestDtoSchema>;
export type ProcedureDto = z.infer<typeof ProcedureDtoSchema>;
