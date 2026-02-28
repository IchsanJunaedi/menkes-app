import { Module } from '@nestjs/common';
import { PractitionersService } from './practitioners.service';
import { PractitionersController } from './practitioners.controller';

@Module({
  providers: [PractitionersService],
  controllers: [PractitionersController]
})
export class PractitionersModule {}
