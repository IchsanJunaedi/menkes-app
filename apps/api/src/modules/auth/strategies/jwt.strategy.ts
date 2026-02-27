import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { TokenRevocationService } from '../token-revocation.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly revocationService: TokenRevocationService) {
        super({
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`,
            }),
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            algorithms: ['RS256'],
        });
    }

    async validate(payload: any) {
        if (!payload.sub) {
            throw new UnauthorizedException('Token missing subject');
        }

        if (payload.jti) {
            const isRevoked = await this.revocationService.isTokenRevoked(payload.jti);
            if (isRevoked) {
                throw new UnauthorizedException('Token has been revoked or logged out');
            }
        }

        return {
            id: payload.sub,
            email: payload.email,
            username: payload.preferred_username,
            roles: payload.realm_access?.roles || [],
            orgId: payload.organization_id || null,
        };
    }
}
