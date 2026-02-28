import { createZodDto } from 'nestjs-zod';
import { CreatePractitionerDtoSchema } from '@sehatku/shared';

export class CreatePractitionerDto extends createZodDto(CreatePractitionerDtoSchema) { }
