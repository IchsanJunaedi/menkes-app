import { createZodDto } from 'nestjs-zod';
import { CreateAllergyDtoSchema } from '@sehatku/shared';

export class CreateAllergyDto extends createZodDto(CreateAllergyDtoSchema) { }
