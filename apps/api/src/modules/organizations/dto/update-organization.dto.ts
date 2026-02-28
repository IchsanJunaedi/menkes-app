import { createZodDto } from 'nestjs-zod';
import { UpdateOrganizationDtoSchema } from '@sehatku/shared';

export class UpdateOrganizationDto extends createZodDto(UpdateOrganizationDtoSchema) { }
