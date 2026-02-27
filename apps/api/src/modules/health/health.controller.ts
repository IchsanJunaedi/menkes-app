import { Controller, Get } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async checkHealth() {
    let dbStatus = 'disconnected';

    try {
      // Execute a simple query to verify db connection
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (e) {
      dbStatus = 'error';
    }

    return {
      status: 'ok',
      db: dbStatus,
      redis: 'pending', // Will implement redis check later
    };
  }
}
