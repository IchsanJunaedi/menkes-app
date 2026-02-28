import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Histogram, Counter } from 'prom-client';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
    constructor(
        @InjectMetric('http_request_duration_seconds')
        private readonly histogram: Histogram<string>,
        @InjectMetric('http_requests_total')
        private readonly counter: Counter<string>,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const req = ctx.getRequest();
        const res = ctx.getResponse();

        // Ignore metrics endpoint from logging its own metrics
        if (req.url === '/metrics') {
            return next.handle();
        }

        const startTimer = this.histogram.startTimer({
            method: req.method,
            route: req.route ? req.route.path : req.url,
        });

        return next.handle().pipe(
            tap(() => {
                this.counter.inc({
                    method: req.method,
                    route: req.route ? req.route.path : req.url,
                    status_code: res.statusCode,
                });
                startTimer({ status_code: res.statusCode });
            }),
            catchError((error: any) => {
                const status = error instanceof HttpException ? error.getStatus() : 500;
                this.counter.inc({
                    method: req.method,
                    route: req.route ? req.route.path : req.url,
                    status_code: status.toString(),
                });
                startTimer({ status_code: status.toString() });
                return throwError(() => error);
            }),
        );
    }
}
