import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import { Injectable, Logger } from '@nestjs/common'
import type { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import type { Request } from 'express'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>()
    const { method, url } = request
    const startTime = Date.now()

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startTime
        this.logger.log(`${method} ${url} - ${responseTime}ms`)
      }),
    )
  }
}
