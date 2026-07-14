import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AdaptationEvent {
  triggeredAt: string;
  reason: string;
  action: string;
}

@Injectable()
export class PlanAdaptationService {
  constructor(private prisma: PrismaService) {}

  // ─── Deload Trigger (Doc 3 §5 — DUP auto-regulation) ─────────────────────
  // If average RPE > target for 2+ consecutive weeks → deload week

  async checkAndTriggerDeload(userId: string, planId: string): Promise<void> {
    const plan = await this.prisma.workoutPlan.findUnique({ where: { id: planId } });
    if (!plan || plan.deloadTriggered) return;

    const params = plan.programParameters as any;
    const targetMaxRPE = params?.intensityModel?.maxRPE ?? 8;

    // Get last 14 days of sessions with rpeAverage
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);

    const recentSessions = await this.prisma.workoutSession.findMany({
      where: { userId, planId, sessionDate: { gte: cutoff }, status: { in: ['completed', 'partial'] } },
      select: { rpeAverage: true, sessionDate: true },
      orderBy: { sessionDate: 'asc' },
    });

    if (recentSessions.length < 4) return; // not enough data

    const validSessions = recentSessions.filter((s) => s.rpeAverage !== null);
    if (validSessions.length < 3) return;

    // Check if ≥ 60% of sessions are above target RPE
    const overRPE = validSessions.filter((s) => s.rpeAverage! > targetMaxRPE).length;
    const overRPERate = overRPE / validSessions.length;

    if (overRPERate >= 0.6) {
      await this.triggerDeload(planId, `${Math.round(overRPERate * 100)}% of sessions exceeded target RPE (${targetMaxRPE})`);
    }
  }

  // ─── Progressive Overload Suggestions ────────────────────────────────────
  // 3 consecutive sessions hitting top of rep range → suggest load increase

  async getProgressionSuggestions(userId: string, planId: string): Promise<Array<{
    exerciseId: string;
    suggestion: 'increase_load' | 'decrease_load' | 'maintain';
    reason: string;
    suggestedChange: number; // percentage
  }>> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 21); // last 3 weeks

    const logs = await this.prisma.performanceLog.findMany({
      where: { userId, planId, sessionDate: { gte: cutoff } },
      orderBy: { sessionDate: 'asc' },
    });

    const byExercise = new Map<string, typeof logs>();
    for (const log of logs) {
      if (!byExercise.has(log.exerciseId)) byExercise.set(log.exerciseId, []);
      byExercise.get(log.exerciseId)!.push(log);
    }

    const suggestions: Array<{
      exerciseId: string;
      suggestion: 'increase_load' | 'decrease_load' | 'maintain';
      reason: string;
      suggestedChange: number;
    }> = [];

    for (const [exerciseId, exLogs] of byExercise.entries()) {
      if (exLogs.length < 3) continue;

      const recentThree = exLogs.slice(-3);
      const completionRates = recentThree.map((l) =>
        l.targetSets > 0 ? l.completedSets / l.targetSets : 1,
      );
      const avgCompletion = completionRates.reduce((s, r) => s + r, 0) / completionRates.length;

      const avgRPE = recentThree
        .flatMap((l) => (l.sets as any[]).map((s: any) => s.rpe ?? null).filter((r: any) => r !== null))
        .reduce((sum, r, _, arr) => sum + r / arr.length, 0);

      if (avgCompletion >= 0.95 && avgRPE < 7) {
        suggestions.push({
          exerciseId,
          suggestion: 'increase_load',
          reason: `Consistently completing all sets (${Math.round(avgCompletion * 100)}%) at low RPE (avg ${avgRPE.toFixed(1)})`,
          suggestedChange: 5, // +5%
        });
      } else if (avgCompletion < 0.70 || avgRPE > 9) {
        suggestions.push({
          exerciseId,
          suggestion: 'decrease_load',
          reason: avgCompletion < 0.70
            ? `Set completion rate below 70% (${Math.round(avgCompletion * 100)}%)`
            : `Average RPE too high (${avgRPE.toFixed(1)}) — risk of overtraining`,
          suggestedChange: -5, // -5%
        });
      } else {
        suggestions.push({ exerciseId, suggestion: 'maintain', reason: 'Performance on target', suggestedChange: 0 });
      }
    }

    return suggestions;
  }

  // ─── Adherence Check ────────────────────────────────────────────────────
  // If attendance < 50% → suggest frequency reduction

  async checkAdherence(userId: string, planId: string): Promise<{
    adherenceRate: number;
    missedSessions: number;
    totalPlanned: number;
    recommendation?: string;
  }> {
    const plan = await this.prisma.workoutPlan.findUnique({ where: { id: planId } });
    if (!plan) return { adherenceRate: 0, missedSessions: 0, totalPlanned: 0 };

    const params = plan.programParameters as any;
    const frequency = params?.frequency ?? 3;

    // Count weeks since plan created
    const weeksElapsed = Math.max(1, Math.round((Date.now() - plan.createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000)));
    const totalPlanned = weeksElapsed * frequency;

    const completedCount = await this.prisma.workoutSession.count({
      where: { userId, planId, status: { in: ['completed', 'partial'] } },
    });

    const missedSessions = Math.max(0, totalPlanned - completedCount);
    const adherenceRate = Math.min(1, completedCount / totalPlanned);

    let recommendation: string | undefined;
    if (adherenceRate < 0.5 && weeksElapsed >= 2) {
      recommendation =
        `Your adherence rate is ${Math.round(adherenceRate * 100)}%. ` +
        `Consider reducing your training frequency from ${frequency} to ${Math.max(2, frequency - 1)} days/week ` +
        `to build a more consistent habit.`;
    }

    return { adherenceRate, missedSessions, totalPlanned, recommendation };
  }

  // ─── Deload Execution ─────────────────────────────────────────────────────
  // Marks plan with deload flag; frontend renders a deload week (–40% volume, –30% load)

  private async triggerDeload(planId: string, reason: string): Promise<void> {
    const plan = await this.prisma.workoutPlan.findUnique({ where: { id: planId } });
    if (!plan) return;

    const existingLog = (plan.adaptationLog as AdaptationEvent[] | null) ?? [];
    const newEvent: AdaptationEvent = {
      triggeredAt: new Date().toISOString(),
      reason: `AUTO DELOAD: ${reason}`,
      action: 'Reduce all working sets by 40% and load by 30% for one week.',
    };

    await this.prisma.workoutPlan.update({
      where: { id: planId },
      data: {
        deloadTriggered: true,
        adaptationLog: [...existingLog, newEvent] as any,
      },
    });
  }

  // ─── Manual Plan Adaptation ───────────────────────────────────────────────
  // Called when user explicitly requests plan update

  async adaptPlan(userId: string, planId: string): Promise<{
    deloadTriggered: boolean;
    suggestions: Awaited<ReturnType<PlanAdaptationService['getProgressionSuggestions']>>;
    adherence: Awaited<ReturnType<PlanAdaptationService['checkAdherence']>>;
  }> {
    await this.checkAndTriggerDeload(userId, planId);
    const [suggestions, adherence, plan] = await Promise.all([
      this.getProgressionSuggestions(userId, planId),
      this.checkAdherence(userId, planId),
      this.prisma.workoutPlan.findUnique({ where: { id: planId }, select: { deloadTriggered: true } }),
    ]);

    return { deloadTriggered: plan?.deloadTriggered ?? false, suggestions, adherence };
  }
}
