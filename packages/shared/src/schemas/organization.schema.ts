import { z } from 'zod';

export const CreateOrganizationDtoSchema = z.object({
    name: z.string().min(3, "Organization name must be at least 3 characters"),
    type: z.enum(['HOSPITAL', 'CLINIC', 'PUSKESMAS', 'LABORATORY', 'PHARMACY']),
    province: z.string().min(2, "Province is required"),
    city: z.string().min(2, "City is required"),
    parentId: z.string().cuid("Invalid parent organization ID").optional(),
    isActive: z.boolean().optional(),
});

export const UpdateOrganizationDtoSchema = CreateOrganizationDtoSchema.partial();

export type CreateOrganizationDto = z.infer<typeof CreateOrganizationDtoSchema>;
export type UpdateOrganizationDto = z.infer<typeof UpdateOrganizationDtoSchema>;
