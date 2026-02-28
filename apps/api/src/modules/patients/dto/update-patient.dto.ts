import { createZodDto } from 'nestjs-zod';
import { UpdatePatientDtoSchema } from '@sehatku/shared';

export class UpdatePatientDto extends createZodDto(UpdatePatientDtoSchema) { }
