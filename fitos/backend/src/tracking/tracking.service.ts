import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogSessionDto, UpdateSessionDto } from './dto/log-session.dto';
import { PlanAdaptationService } from './plan-adaptation.service';

@Injectable()
export class TrackingService {
  constructor(
    private prisma: PrismaService,
    private adaptation: PlanAdaptationService,
  ) {}

  // ─── Log a full session ───────────────────────────────────────────────────

  async logSession(userId: string, dto: LogSessionDto) {
    const plan = await this.prisma.workoutPlan.findUnique({ where: { id: dto.planId } });
    if (!plan) throw new NotFoundException({ errorCode: 'PLAN_NOT_FOUND', message: 'Plan not found' });
    if (plan.userId !== userId) throw new ForbiddenException({ errorCode: 'ACCESS_DENIED' });

    // Check for duplicate session (same plan + dayNumber + date)
    const sessionDate = new Date(dto.sessionDate);
    const existing = await this.prisma.workoutSession.findFirst({
      where: { userId, planId: dto.planId, dayNumber: dto.dayNumber, sessionDate },
    });
    if (existing) {
      throw new BadRequestException({ errorCode: 'SESSION_ALREADY_LOGGED', message: 'Session already logged for this day' });
    }

    // Create WorkoutSession + all PerformanceLogs in a transaction
    const session = await this.prisma.$transaction(async (tx) => {
      const ws = await tx.workoutSession.create({
        data: {
          userId,
          planId: dto.planId,
          sessionDate,
          dayNumber: dto.dayNumber,
          status: dto.status,
          durationMinutes: dto.durationMinutes,
          rpeAverage: dto.rpeAverage,
          notes: dto.notes,
        },
      });

      for (const ex of dto.exercises) {
        const completedSets = ex.sets.filter((s) => s.completed).length;
        const loads = ex.sets.filter((s) => s.load !== undefined && s.completed).map((s) => s.load!);
        const maxLoad = loads.length > 0 ? Math.max(...loads) : null;

        // Epley e1RM: load × (1 + reps/30)
        const e1RMs = ex.sets
          .filter((s) => s.completed && s.load && s.reps > 0)
          .map((s) => s.load! * (1 + s.reps / 30));
        const estimatedE1RM = e1RMs.length > 0 ? Math.max(...e1RMs) : null;

        await tx.performanceLog.create({
          data: {
            userId,
            exerciseId: ex.exerciseId,
            planId: dto.planId,
            sessionId: ws.id,
            sessionDate,
            sets: ex.sets as any,
            completedSets,
            targetSets: ex.targetSets,
            maxLoad,
            estimatedE1RM,
            notes: ex.notes,
          },
        });

        // Update personal record if e1RM beats existing
        if (estimatedE1RM !== null) {
          await this.updatePersonalRecord(tx, userId, ex.exerciseId, sessionDate, estimatedE1RM, maxLoad ?? 0, ex.sets);
        }
      }

      return ws;
    });

    // After logging: check if deload should be triggered
    if (dto.status !== 'missed') {
      await this.adaptation.checkAndTriggerDeload(userId, dto.planId);
    }

    return session;
  }

  async getSession(sessionId: string, userId: string) {
    const session = await this.prisma.workoutSession.findUnique({
      where: { id: sessionId },
      include: { performanceLogs: true },
    });
    if (!session) throw new NotFoundException({ errorCode: 'SESSION_NOT_FOUND' });
    if (session.userId !== userId) throw new ForbiddenException({ errorCode: 'ACCESS_DENIED' });
    return session;
  }

  async listSessions(userId: string, planId?: string) {
    return this.prisma.workoutSession.findMany({
      where: { userId, ...(planId ? { planId } : {}) },
      include: {
        performanceLogs: {
          select: { exerciseId: true, completedSets: true, targetSets: true, maxLoad: true, estimatedE1RM: true },
        },
      },
      orderBy: { sessionDate: 'desc' },
    });
  }

  async updateSession(sessionId: string, userId: string, dto: UpdateSessionDto) {
    const session = await this.prisma.workoutSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException({ errorCode: 'SESSION_NOT_FOUND' });
    if (session.userId !== userId) throw new ForbiddenException({ errorCode: 'ACCESS_DENIED' });

    return this.prisma.workoutSession.update({
      where: { id: sessionId },
      data: { ...dto },
    });
  }

  // ─── Personal Record Update ───────────────────────────────────────────────
  // Uses Epley formula: e1RM = load × (1 + reps/30)

  private async updatePersonalRecord(
    tx: any,
    userId: string,
    exerciseId: string,
    recordDate: Date,
    e1RM: number,
    maxLoad: number,
    sets: any[],
  ) {
    const existing = await tx.personalRecord.findUnique({ where: { userId_exerciseId: { userId, exerciseId } } });

    if (!existing || e1RM > existing.e1RM) {
      const bestSet = sets.filter((s) => s.completed && s.load && s.reps > 0).reduce((best: any, s: any) => {
        const curr = s.load! * (1 + s.reps / 30);
        const bestE1 = best ? best.load * (1 + best.reps / 30) : 0;
        return curr > bestE1 ? s : best;
      }, null);

      await tx.personalRecord.upsert({
        where: { userId_exerciseId: { userId, exerciseId } },
        create: {
          userId,
          exerciseId,
          recordDate,
          e1RM,
          load: bestSet?.load ?? maxLoad,
          reps: bestSet?.reps ?? 1,
          sets: sets.filter((s) => s.completed).length,
        },
        update: {
          recordDate,
          e1RM,
          load: bestSet?.load ?? maxLoad,
          reps: bestSet?.reps ?? 1,
          sets: sets.filter((s) => s.completed).length,
        },
      });
    }
  }
}
