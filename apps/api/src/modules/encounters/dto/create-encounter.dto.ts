import { createZodDto } from 'nestjs-zod';
import { CreateEncounterDtoSchema } from '@sehatku/shared';

export class CreateEncounterDto extends createZodDto(CreateEncounterDtoSchema) { }
