import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const isObject = typeof exceptionResponse === 'object' && exceptionResponse !== null;

    const body = {
      statusCode: status,
      errorCode: isObject && 'errorCode' in exceptionResponse
        ? (exceptionResponse as Record<string, unknown>)['errorCode']
        : 'INTERNAL_ERROR',
      message: isObject && 'message' in exceptionResponse
        ? (exceptionResponse as Record<string, unknown>)['message']
        : String(exception),
      ...(isObject && 'errors' in exceptionResponse
        ? { errors: (exceptionResponse as Record<string, unknown>)['errors'] }
        : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (status >= 500) {
      this.logger.error(`[${request.method}] ${request.url} → ${status}`, exception as Error);
    }

    response.status(status).json(body);
  }
}
