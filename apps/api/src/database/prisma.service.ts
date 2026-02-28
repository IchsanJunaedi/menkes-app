import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { fieldEncryptionMiddleware } from './encryption.middleware';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      this.$use(fieldEncryptionMiddleware);
      await this.$connect();
      console.log('Successfully connected to database');
    } catch (error) {
      console.warn(
        'Failed to connect to database on startup. Will retry on first query.',
        (error as Error).message,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
