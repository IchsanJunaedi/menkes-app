import { Strategy } from 'passport-jwt';
import { TokenRevocationService } from '../token-revocation.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly revocationService;
    constructor(revocationService: TokenRevocationService);
    validate(payload: any): Promise<{
        id: any;
        email: any;
        username: any;
        roles: any;
        orgId: any;
    }>;
}
export {};
//# sourceMappingURL=jwt.strategy.d.ts.map