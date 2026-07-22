import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiErrorResponse, ValidationErrorDetail } from '../types/api-response.type';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { statusCode, message, errors } = this.resolveError(exception);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${statusCode}] ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`[${statusCode}] ${message}`);
    }

    const body: ApiErrorResponse = {
      success: false,
      message,
      statusCode,
      ...(errors ? { errors } : {}),
    };

    response.status(statusCode).json(body);
  }

  private resolveError(exception: unknown): {
    statusCode: number;
    message: string;
    errors?: ValidationErrorDetail[];
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'object' && response !== null) {
        const responseObj = response as { message?: unknown; errors?: ValidationErrorDetail[] };
        const message = Array.isArray(responseObj.message)
          ? responseObj.message.join(', ')
          : (responseObj.message ?? exception.message);

        return {
          statusCode: status,
          message: String(message),
          errors: responseObj.errors,
        };
      }

      return { statusCode: status, message: exception.message };
    }

    if (exception instanceof ZodError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errors: exception.issues.map((issue) => ({
          field: issue.path.join('.') || '(root)',
          message: issue.message,
        })),
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.resolvePrismaError(exception);
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }

  private resolvePrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    statusCode: number;
    message: string;
  } {
    switch (exception.code) {
      case 'P2002': {
        const target = (exception.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
        return { statusCode: HttpStatus.CONFLICT, message: `Giá trị của "${target}" đã tồn tại` };
      }
      case 'P2025':
        return { statusCode: HttpStatus.NOT_FOUND, message: 'Không tìm thấy dữ liệu' };
      case 'P2003':
        return { statusCode: HttpStatus.BAD_REQUEST, message: 'Dữ liệu tham chiếu không hợp lệ' };
      default:
        return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Database error' };
    }
  }
}
