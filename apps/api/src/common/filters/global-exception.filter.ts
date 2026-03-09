import type { ExceptionFilter, ArgumentsHost } from '@nestjs/common'
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common'
import * as Sentry from '@sentry/node'
import type { Request, Response } from 'express'

interface ErrorResponse {
  statusCode: number
  message: string
  error: string
  timestamp: string
  path: string
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let error = 'Internal Server Error'

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>
        message = (responseObj.message as string) ?? message
        error = (responseObj.error as string) ?? exception.name
      }

      error = exception.name
    } else if (exception instanceof Error) {
      message = exception.message
      error = exception.name
    }

    const errorResponse: ErrorResponse = {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    }

    // Log the error details
    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      )
      Sentry.captureException(exception, {
        extra: { method: request.method, url: request.url, statusCode },
      })
    } else {
      this.logger.warn(`${request.method} ${request.url} - ${statusCode}: ${message}`)
    }

    response.status(statusCode).json(errorResponse)
  }
}
