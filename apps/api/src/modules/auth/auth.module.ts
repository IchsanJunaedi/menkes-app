import { Module } from '@nestjs/common';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { TokenRevocationService } from './token-revocation.service';

@Module({
    controllers: [AuthController],
    providers: [JwtStrategy, TokenRevocationService],
    exports: [TokenRevocationService],
})
export class AuthModule { }
