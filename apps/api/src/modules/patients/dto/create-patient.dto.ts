import { createZodDto } from 'nestjs-zod';
import { CreatePatientDtoSchema } from '@sehatku/shared';

// Create a NestJS-compatible DTO from our shared Zod schema
export class CreatePatientDto extends createZodDto(CreatePatientDtoSchema) { }
