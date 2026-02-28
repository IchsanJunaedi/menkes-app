"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePatientDtoSchema = exports.CreatePatientDtoSchema = exports.PatientIdentitySchema = void 0;
const zod_1 = require("zod");
// Base DTO for nested data
exports.PatientIdentitySchema = zod_1.z.object({
    system: zod_1.z.string().min(1, "Identity system is required (e.g., 'bpjs', 'nik')"),
    value: zod_1.z.string().min(1, "Identity value is required"),
});
// Create MpiRecord embedded with Patient data
exports.CreatePatientDtoSchema = zod_1.z.object({
    nik: zod_1.z.string()
        .length(16, "NIK must be exactly 16 characters long")
        .regex(/^\d+$/, "NIK must contain only numbers"),
    goldenName: zod_1.z.string().min(2, "Golden name must be at least 2 characters"),
    dateOfBirth: zod_1.z.string().datetime("Date of birth must be a valid ISO8601 string"),
    gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']),
    addressProvince: zod_1.z.string().optional(),
    addressCity: zod_1.z.string().optional(),
    // Optional linkage to an existing User if the patient themselves accesses the system
    userId: zod_1.z.string().cuid("Invalid User ID").optional(),
    identities: zod_1.z.array(exports.PatientIdentitySchema).optional(),
});
exports.UpdatePatientDtoSchema = exports.CreatePatientDtoSchema.partial();
//# sourceMappingURL=patient.schema.js.map