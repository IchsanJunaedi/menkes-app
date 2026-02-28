import { Module } from '@nestjs/common';
import { AllergiesService } from './allergies.service';
import { AllergiesController } from './allergies.controller';

@Module({
  providers: [AllergiesService],
  controllers: [AllergiesController]
})
export class AllergiesModule {}
