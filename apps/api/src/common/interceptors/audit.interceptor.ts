import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { IS_NO_AUDIT_KEY } from '../decorators/no-audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(private prisma: PrismaService, private reflector: Reflector) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const isNoAudit = this.reflector.getAllAndOverride<boolean>(IS_NO_AUDIT_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isNoAudit) {
            return next.handle();
        }

        const request = context.switchToHttp().getRequest();
        const { method, url, user, ip, headers } = request;

        const sensitiveReadResources = ['patients', 'encounters', 'documents'];
        const segments = url.split('/').filter(Boolean);
        const baseResource = segments[1] || ''; // api/RESOURCE/...

        // We primarily track data mutations, but also sensitive Read operations
        if (method === 'GET' && !sensitiveReadResources.includes(baseResource)) {
            return next.handle();
        } else if (!['POST', 'PUT', 'PATCH', 'DELETE', 'GET'].includes(method)) {
            return next.handle();
        }

        return next.handle().pipe(
            tap(async (responsePayload: any) => {
                try {
                    // Determine the target resource dynamically from the REST path segments
                    const resourceType = segments[1] || 'unknown'; // api/RESOURCE/...

                    let resourceId = 'unknown';
                    if (responsePayload && responsePayload.id) {
                        resourceId = responsePayload.id; // Newly created IDs
                    } else if (segments.length >= 3) {
                        resourceId = segments[2]; // Target mutated ID (e.g. PATCH /patients/123)
                    }

                    // JWT Claims extraction mapping (Safely falling back if public route)
                    const actorId = user?.sub || 'anonymous';
                    const roles = user?.realm_access?.roles || [];
                    const actorRole = roles.length > 0 ? roles.join(',') : 'SYSTEM';

                    const eventType = method === 'POST' ? 'CREATE' : method === 'DELETE' ? 'DELETE' : method === 'GET' ? 'READ' : 'UPDATE';

                    // Async background write to the immutable PG AuditEvents
                    await this.prisma.auditEvent.create({
                        data: {
                            eventType,
                            resourceType,
                            resourceId,
                            actorId,
                            actorRole,
                            ipAddress: headers['x-real-ip'] || ip || 'unknown',
                            userAgent: headers['user-agent'],
                            isEmergency: false, // Override later if this hits a break-glass route
                            metadata: { url, method, bodyPreview: request.body } // Store what essentially triggered the mutation
                        }
                    });

                } catch (error) {
                    // Do not disrupt the actual API pipeline response if audit logging fails internally, 
                    // but do log it heavily to Pino so monitoring tools catch the drop.
                    console.error('[AuditInterceptor] Failed to write audit event', error);
                }
            })
        );
    }
}
