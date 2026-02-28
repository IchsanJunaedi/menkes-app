import { z } from 'zod';

export const CreatePractitionerDtoSchema = z.object({
    userId: z.string().cuid("Must provide a valid User ID to link this practitioner"),
    strNumber: z.string().min(5, "STR number must be at least 5 characters"),
    specialization: z.string().optional(),
    organizationId: z.string().cuid("Practitioner must be bound to an existing Organization"),
});

export const UpdatePractitionerDtoSchema = CreatePractitionerDtoSchema.omit({ userId: true }).partial();

export type CreatePractitionerDto = z.infer<typeof CreatePractitionerDtoSchema>;
export type UpdatePractitionerDto = z.infer<typeof UpdatePractitionerDtoSchema>;
