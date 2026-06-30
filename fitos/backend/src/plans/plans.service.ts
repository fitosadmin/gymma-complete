import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecommendationEngineService } from './recommendation-engine.service';

@Injectable()
export class PlansService {
  constructor(
    private prisma: PrismaService,
    private engine: RecommendationEngineService,
  ) {}

  async generatePlan(assessmentId: string, userId: string) {
    return this.engine.generatePlan(assessmentId, userId);
  }

  async getPlan(planId: string, userId: string) {
    const plan = await this.prisma.workoutPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException({ errorCode: 'PLAN_NOT_FOUND', message: 'Workout plan not found' });
    }

    if (plan.userId !== userId) {
      throw new ForbiddenException({ errorCode: 'PLAN_ACCESS_DENIED', message: 'Access denied to this plan' });
    }

    return plan;
  }

  async listUserPlans(userId: string) {
    return this.prisma.workoutPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        assessmentId: true,
        createdAt: true,
        metadata: true,
        programParameters: true,
        safetyFlags: true,
      },
    });
  }

  async logPerformance(
    planId: string,
    userId: string,
    data: { exerciseId: string; sets: number; reps: number; load?: number; rpe?: number; notes?: string },
  ) {
    const plan = await this.prisma.workoutPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException({ errorCode: 'PLAN_NOT_FOUND', message: 'Workout plan not found' });
    if (plan.userId !== userId) throw new ForbiddenException({ errorCode: 'ACCESS_DENIED', message: 'Access denied' });

    return this.prisma.performanceLog.create({
      data: {
        userId,
        exerciseId: data.exerciseId,
        planId,
        sessionDate: new Date(),
        sets: { sets: data.sets, reps: data.reps, load: data.load ?? null, rpe: data.rpe ?? null } as any,
        notes: data.notes,
      },
    });
  }
}
