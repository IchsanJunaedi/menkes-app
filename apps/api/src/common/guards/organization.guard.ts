import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const REQUIRE_ORG_MATCH_KEY = 'requireOrgMatch';
export const RequireOrgMatch = Reflector.createDecorator<boolean>({ key: REQUIRE_ORG_MATCH_KEY });

@Injectable()
export class OrganizationGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requireOrgMatch = this.reflector.getAllAndOverride<boolean>(REQUIRE_ORG_MATCH_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requireOrgMatch) {
            return true; // No org match required for this route
        }

        const request = context.switchToHttp().getRequest();
        const { user, params, body, query } = request;

        if (!user) {
            throw new ForbiddenException('User is not authenticated');
        }

        // Admins can bypass organization checks
        const userRoles: string[] = user.roles || [];
        if (userRoles.includes('ADMIN') || userRoles.includes('AUDITOR')) {
            return true;
        }

        // Extract requested organization ID from URL params, body, or query
        const targetOrgId = params.orgId || body.organizationId || query.orgId;

        if (!targetOrgId) {
            // If the route requires org match but doesn't specify which org, 
            // assume they are accessing their own org resources automatically
            return true;
        }

        if (user.orgId !== targetOrgId) {
            throw new ForbiddenException(`User does not belong to organization ${targetOrgId}`);
        }

        return true;
    }
}
