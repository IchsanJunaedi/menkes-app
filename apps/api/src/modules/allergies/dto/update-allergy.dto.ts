import { createZodDto } from 'nestjs-zod';
import { UpdateAllergyDtoSchema } from '@sehatku/shared';

export class UpdateAllergyDto extends createZodDto(UpdateAllergyDtoSchema) { }
