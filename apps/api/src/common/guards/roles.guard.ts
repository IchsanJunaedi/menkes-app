import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true; // No roles required, allow access
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user || (!user.roles && !user.realm_access?.roles)) {
            throw new ForbiddenException('User does not have any assigned roles');
        }

        // Adapt to Keycloak standard token format where roles are inside realm_access
        const userRoles: string[] = user.roles || user.realm_access?.roles || [];

        const hasRole = requiredRoles.some((role) => userRoles.includes(role));

        if (!hasRole) {
            throw new ForbiddenException(`Access forbidden. Required roles: ${requiredRoles.join(', ')}`);
        }

        return true;
    }
}
