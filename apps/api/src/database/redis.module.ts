import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: (configService: ConfigService) => {
                // Zod hasn't mapped REDIS_URL yet, use process.env fallback or extend env configuration
                return new Redis(process.env.REDIS_URL || 'redis://localhost:6380', {
                    maxRetriesPerRequest: 3,
                });
            },
            inject: [ConfigService],
        },
    ],
    exports: ['REDIS_CLIENT'],
})
export class RedisModule { }
