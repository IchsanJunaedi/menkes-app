import { PrismaService } from '../../database/prisma.service';
export declare class HealthController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    checkHealth(): Promise<{
        status: string;
        db: string;
        redis: string;
    }>;
}
//# sourceMappingURL=health.controller.d.ts.map