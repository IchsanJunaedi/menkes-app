import { z } from 'zod';

// Base DTO for nested data
export const PatientIdentitySchema = z.object({
    system: z.string().min(1, "Identity system is required (e.g., 'bpjs', 'nik')"),
    value: z.string().min(1, "Identity value is required"),
});

// Create MpiRecord embedded with Patient data
export const CreatePatientDtoSchema = z.object({
    nik: z.string()
        .length(16, "NIK must be exactly 16 characters long")
        .regex(/^\d+$/, "NIK must contain only numbers"),
    goldenName: z.string().min(2, "Golden name must be at least 2 characters"),
    dateOfBirth: z.string().datetime("Date of birth must be a valid ISO8601 string"),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    addressProvince: z.string().optional(),
    addressCity: z.string().optional(),

    // Optional linkage to an existing User if the patient themselves accesses the system
    userId: z.string().cuid("Invalid User ID").optional(),

    identities: z.array(PatientIdentitySchema).optional(),
});

export const UpdatePatientDtoSchema = CreatePatientDtoSchema.partial();

export type CreatePatientDto = z.infer<typeof CreatePatientDtoSchema>;
export type UpdatePatientDto = z.infer<typeof UpdatePatientDtoSchema>;
