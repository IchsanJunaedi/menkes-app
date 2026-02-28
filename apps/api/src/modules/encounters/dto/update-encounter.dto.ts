import { createZodDto } from 'nestjs-zod';
import { UpdateEncounterDtoSchema } from '@sehatku/shared';

export class UpdateEncounterDto extends createZodDto(UpdateEncounterDtoSchema) { }
