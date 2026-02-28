import { createZodDto } from 'nestjs-zod';
import { CreateOrganizationDtoSchema } from '@sehatku/shared';

export class CreateOrganizationDto extends createZodDto(CreateOrganizationDtoSchema) { }
