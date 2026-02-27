import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class TokenRevocationService {
    constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) { }

    async blockToken(jti: string, expiresInSecs: number): Promise<void> {
        if (!jti) return;

        // Store token ID in redis until it naturally expires
        await this.redis.setex(`bl_${jti}`, expiresInSecs, 'revoked');
    }

    async isTokenRevoked(jti: string): Promise<boolean> {
        if (!jti) return false;

        const exists = await this.redis.get(`bl_${jti}`);
        return !!exists;
    }
}
