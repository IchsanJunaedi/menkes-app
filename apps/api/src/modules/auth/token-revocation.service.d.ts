import Redis from 'ioredis';
export declare class TokenRevocationService {
    private readonly redis;
    constructor(redis: Redis);
    blockToken(jti: string, expiresInSecs: number): Promise<void>;
    isTokenRevoked(jti: string): Promise<boolean>;
}
//# sourceMappingURL=token-revocation.service.d.ts.map