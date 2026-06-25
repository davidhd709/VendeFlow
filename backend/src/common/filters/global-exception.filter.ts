import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { BusinessError } from '../errors/business-error';

/**
 * Normaliza todas las excepciones al contrato de error de la plataforma:
 * { statusCode, error, message, field? }. Nunca expone stack traces.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'INTERNAL_ERROR';
    let message = 'Error inesperado. Intenta de nuevo.';
    let field: string | undefined;

    if (exception instanceof BusinessError) {
      statusCode = exception.statusCode;
      error = exception.error;
      message = exception.message;
      field = exception.field;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
        error = HttpStatus[statusCode] ?? error;
      } else {
        const body = res as {
          error?: string;
          message?: string | string[];
          field?: string;
        };
        error = body.error ?? HttpStatus[statusCode] ?? error;
        message = Array.isArray(body.message)
          ? body.message[0]
          : (body.message ?? message);
        field = body.field;
      }
    } else {
      this.logger.error('Excepción no controlada', exception as Error);
    }

    response.status(statusCode).json({
      statusCode,
      error,
      message,
      ...(field ? { field } : {}),
    });
  }
}
