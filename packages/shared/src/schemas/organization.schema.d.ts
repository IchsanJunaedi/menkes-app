import { z } from 'zod';
export declare const CreateOrganizationDtoSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodEnum<{
        HOSPITAL: "HOSPITAL";
        CLINIC: "CLINIC";
        PUSKESMAS: "PUSKESMAS";
        LABORATORY: "LABORATORY";
        PHARMACY: "PHARMACY";
    }>;
    province: z.ZodString;
    city: z.ZodString;
    parentId: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const UpdateOrganizationDtoSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<{
        HOSPITAL: "HOSPITAL";
        CLINIC: "CLINIC";
        PUSKESMAS: "PUSKESMAS";
        LABORATORY: "LABORATORY";
        PHARMACY: "PHARMACY";
    }>>;
    province: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export type CreateOrganizationDto = z.infer<typeof CreateOrganizationDtoSchema>;
export type UpdateOrganizationDto = z.infer<typeof UpdateOrganizationDtoSchema>;
//# sourceMappingURL=organization.schema.d.ts.map