"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateOrganizationDtoSchema = exports.CreateOrganizationDtoSchema = void 0;
const zod_1 = require("zod");
exports.CreateOrganizationDtoSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, "Organization name must be at least 3 characters"),
    type: zod_1.z.enum(['HOSPITAL', 'CLINIC', 'PUSKESMAS', 'LABORATORY', 'PHARMACY']),
    province: zod_1.z.string().min(2, "Province is required"),
    city: zod_1.z.string().min(2, "City is required"),
    parentId: zod_1.z.string().cuid("Invalid parent organization ID").optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.UpdateOrganizationDtoSchema = exports.CreateOrganizationDtoSchema.partial();
//# sourceMappingURL=organization.schema.js.map