import { ZodValidationPipe } from 'nestjs-zod';
import { NestFactory, HttpAdapterHost, BaseExceptionFilter } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { XssValidationPipe } from './common/pipes/xss-validation.pipe';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { loadVaultSecrets } from './config/vault.service';
import { PrismaService } from './database/prisma.service';
import { Reflector } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { Histogram, Counter } from 'prom-client';
import { getToken } from '@willsoto/nestjs-prometheus';

async function bootstrap() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || '',
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
  });

  await loadVaultSecrets();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  // Enable CORS
  app.enableCors();

  // Set global prefix if needed
  app.setGlobalPrefix('api');

  // Global Pipes, Filters, and Interceptors
  app.useGlobalPipes(new XssValidationPipe());
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());

  const histogram = app.get<Histogram<string>>(getToken('http_request_duration_seconds'));
  const counter = app.get<Counter<string>>(getToken('http_requests_total'));

  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new AuditInterceptor(app.get(PrismaService), app.get(Reflector)),
    new MetricsInterceptor(histogram, counter)
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('SehatKu National EHR API')
    .setDescription('Core API for the Indonesian National Electronic Health Record System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger docs at: ${await app.getUrl()}/api/docs`);
}
bootstrap();
