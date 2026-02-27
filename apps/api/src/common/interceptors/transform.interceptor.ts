import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Partial<Response<T>>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Partial<Response<T>>> {
    return next.handle().pipe(
      map((data) => {
        // If the controller already returns { data, meta } structure, just wrap it and add timestamp
        if (data && data.data !== undefined) {
          return {
            success: true,
            data: data.data,
            meta: data.meta,
            timestamp: new Date().toISOString(),
          };
        }

        // Output format wrapper
        return {
          success: true,
          data: data || null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
