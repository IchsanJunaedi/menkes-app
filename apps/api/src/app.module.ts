import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { LoggerModule } from 'nestjs-pino';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { randomUUID } from 'crypto';

import envConfig from './config/env.config';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './database/redis.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { PatientsModule } from './modules/patients/patients.module';
import { PractitionersModule } from './modules/practitioners/practitioners.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { EncountersModule } from './modules/encounters/encounters.module';
import { AllergiesModule } from './modules/allergies/allergies.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req) => req.headers['x-correlation-id'] || randomUUID(),
        customProps: (req, _res) => ({
          correlationId: req.headers['x-correlation-id'] || req.id,
        }),
        transport: process.env.NODE_ENV !== 'production'
          ? {
            targets: [
              { target: 'pino-pretty', options: { colorize: true }, level: 'info' },
              {
                target: 'pino-loki',
                options: {
                  batching: true,
                  interval: 5,
                  host: process.env.LOKI_HOST || 'http://localhost:3100',
                  labels: { app: 'sehatku-api', env: 'development' }
                },
                level: 'info',
              },
            ],
          }
          : {
            target: 'pino-loki',
            options: {
              batching: true,
              interval: 5,
              host: process.env.LOKI_HOST || 'http://localhost:3100',
              labels: { app: 'sehatku-api', env: 'production' }
            },
            level: 'info'
          },
      },
    }),
    PrometheusModule.register(),
    DatabaseModule,
    RedisModule,
    HealthModule,
    AuthModule,
    PatientsModule,
    PractitionersModule,
    OrganizationsModule,
    EncountersModule,
    AllergiesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
