import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiSuccessResponse, isPaginatedResult } from '../types/api-response.type';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((result) => {
        if (isPaginatedResult<T>(result)) {
          return {
            success: true as const,
            message: 'Success',
            data: result.items as unknown as T,
            meta: result.meta,
          };
        }

        return {
          success: true as const,
          message: 'Success',
          data: result,
        };
      }),
    );
  }
}
