import { Controller, Post, UseGuards, Request, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TokenRevocationService } from './token-revocation.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly revocationService: TokenRevocationService) { }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout and revoke the current access token' })
    async logout(@Request() req: any) {
        const user = req.user;

        // Assuming the JWT Strategy eventually attaches 'exp' and 'jti' payload directly to user
        // In our manual strategy, we need to extract this from raw JWT or modify the strategy.
        // For now, let's extract it from the authorization header directly

        const authHeader = req.headers.authorization;
        if (!authHeader) return { message: 'Logged out locally' };

        const token = authHeader.split(' ')[1];

        try {
            // Decode JWT payload without verifying signature (since guard already verified it)
            const payloadBase64Url = token.split('.')[1];
            const payloadBuf = Buffer.from(payloadBase64Url, 'base64');
            const payload = JSON.parse(payloadBuf.toString());

            if (payload.jti && payload.exp) {
                const expiresIn = Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
                await this.revocationService.blockToken(payload.jti, expiresIn);
            }
        } catch (e) {
            // Ignore parse errors, token is already verified by passport
        }

        return { message: 'Successfully logged out across the system' };
    }
}
