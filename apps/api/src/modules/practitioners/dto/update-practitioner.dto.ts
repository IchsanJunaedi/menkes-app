import { createZodDto } from 'nestjs-zod';
import { UpdatePractitionerDtoSchema } from '@sehatku/shared';

export class UpdatePractitionerDto extends createZodDto(UpdatePractitionerDtoSchema) { }
