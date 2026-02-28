import { z } from 'zod';
export declare const CreatePractitionerDtoSchema: z.ZodObject<{
    userId: z.ZodString;
    strNumber: z.ZodString;
    specialization: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodString;
}, z.core.$strip>;
export declare const UpdatePractitionerDtoSchema: z.ZodObject<{
    strNumber: z.ZodOptional<z.ZodString>;
    specialization: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    organizationId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreatePractitionerDto = z.infer<typeof CreatePractitionerDtoSchema>;
export type UpdatePractitionerDto = z.infer<typeof UpdatePractitionerDtoSchema>;
//# sourceMappingURL=practitioner.schema.d.ts.map