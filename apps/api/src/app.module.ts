import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import envConfig from './config/env.config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),
    DatabaseModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
