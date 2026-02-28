"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePractitionerDtoSchema = exports.CreatePractitionerDtoSchema = void 0;
const zod_1 = require("zod");
exports.CreatePractitionerDtoSchema = zod_1.z.object({
    userId: zod_1.z.string().cuid("Must provide a valid User ID to link this practitioner"),
    strNumber: zod_1.z.string().min(5, "STR number must be at least 5 characters"),
    specialization: zod_1.z.string().optional(),
    organizationId: zod_1.z.string().cuid("Practitioner must be bound to an existing Organization"),
});
exports.UpdatePractitionerDtoSchema = exports.CreatePractitionerDtoSchema.omit({ userId: true }).partial();
//# sourceMappingURL=practitioner.schema.js.map