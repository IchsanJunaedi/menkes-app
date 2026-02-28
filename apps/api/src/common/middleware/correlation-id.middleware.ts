import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClsService } from 'nestjs-cls';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
    constructor(private readonly cls: ClsService) { }

    use(req: Request, res: Response, next: NextFunction) {
        // Extract existing Correlation ID from the gateway/headers if present, else mint a new UUID
        const id = req.headers['x-correlation-id'] || uuidv4();
        const correlationId = Array.isArray(id) ? id[0] : id;

        // Attach tracking ID to outgoing response headers so clients can trace requests
        res.setHeader('X-Correlation-ID', correlationId);

        // Save ID into the local async storage context payload (cls)
        this.cls.set('correlationId', correlationId);

        next();
    }
}
