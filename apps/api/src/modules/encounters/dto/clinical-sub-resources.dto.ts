import { createZodDto } from 'nestjs-zod';
import {
    ConditionDtoSchema,
    ObservationDtoSchema,
    MedicationRequestDtoSchema,
    ProcedureDtoSchema
} from '@sehatku/shared';

export class ConditionDto extends createZodDto(ConditionDtoSchema) { }
export class ObservationDto extends createZodDto(ObservationDtoSchema) { }
export class MedicationRequestDto extends createZodDto(MedicationRequestDtoSchema) { }
export class ProcedureDto extends createZodDto(ProcedureDtoSchema) { }
