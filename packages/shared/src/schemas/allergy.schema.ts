import { z } from 'zod';

export const CreateAllergyDtoSchema = z.object({
    substance: z.string().min(2, "Substance name is required"),
    criticality: z.enum(['LOW', 'HIGH', 'UNABLE_TO_ASSESS']).default('UNABLE_TO_ASSESS'),
    manifestation: z.string().optional(),
    clinicalStatus: z.enum(['ACTIVE', 'INACTIVE', 'RESOLVED']).default('ACTIVE'),
    notes: z.string().optional(),
});

// Partial updates matching standard PATCH routes
export const UpdateAllergyDtoSchema = CreateAllergyDtoSchema.partial();

export type CreateAllergyDto = z.infer<typeof CreateAllergyDtoSchema>;
export type UpdateAllergyDto = z.infer<typeof UpdateAllergyDtoSchema>;
