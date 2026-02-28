import { z } from 'zod';
export declare const PatientIdentitySchema: z.ZodObject<{
    system: z.ZodString;
    value: z.ZodString;
}, z.core.$strip>;
export declare const CreatePatientDtoSchema: z.ZodObject<{
    nik: z.ZodString;
    goldenName: z.ZodString;
    dateOfBirth: z.ZodString;
    gender: z.ZodEnum<{
        MALE: "MALE";
        FEMALE: "FEMALE";
        OTHER: "OTHER";
    }>;
    addressProvince: z.ZodOptional<z.ZodString>;
    addressCity: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    identities: z.ZodOptional<z.ZodArray<z.ZodObject<{
        system: z.ZodString;
        value: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const UpdatePatientDtoSchema: z.ZodObject<{
    nik: z.ZodOptional<z.ZodString>;
    goldenName: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodString>;
    gender: z.ZodOptional<z.ZodEnum<{
        MALE: "MALE";
        FEMALE: "FEMALE";
        OTHER: "OTHER";
    }>>;
    addressProvince: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    addressCity: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    userId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    identities: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        system: z.ZodString;
        value: z.ZodString;
    }, z.core.$strip>>>>;
}, z.core.$strip>;
export type CreatePatientDto = z.infer<typeof CreatePatientDtoSchema>;
export type UpdatePatientDto = z.infer<typeof UpdatePatientDtoSchema>;
//# sourceMappingURL=patient.schema.d.ts.map