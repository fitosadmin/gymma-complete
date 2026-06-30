import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { method, url } = req;

    return next.handle().pipe(
      tap(() => {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          this.logger.log(`[AUDIT] ${method} ${url} by user=${req.user?.id ?? 'anonymous'}`);
        }
      }),
    );
  }
}

// Exercise-specific audit log helper used by ExerciseService
export async function logExerciseAudit(
  prisma: PrismaService,
  exerciseId: string,
  changedBy: string,
  fieldChanged: string,
  oldValue: unknown,
  newValue: unknown,
  changeReason?: string,
) {
  await prisma.exerciseAuditLog.create({
    data: {
      exerciseId,
      changedBy,
      fieldChanged,
      oldValue: oldValue as any,
      newValue: newValue as any,
      changeReason,
    },
  });
}
