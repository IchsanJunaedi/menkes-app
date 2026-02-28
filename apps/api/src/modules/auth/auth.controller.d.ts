import { TokenRevocationService } from './token-revocation.service';
export declare class AuthController {
    private readonly revocationService;
    constructor(revocationService: TokenRevocationService);
    logout(req: any): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=auth.controller.d.ts.map