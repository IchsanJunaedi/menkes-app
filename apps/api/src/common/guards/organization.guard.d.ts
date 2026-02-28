import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare const REQUIRE_ORG_MATCH_KEY = "requireOrgMatch";
export declare const RequireOrgMatch: import("@nestjs/core").ReflectableDecorator<boolean, boolean>;
export declare class OrganizationGuard implements CanActivate {
    private reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
//# sourceMappingURL=organization.guard.d.ts.map