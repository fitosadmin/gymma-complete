import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // ─── Personal Records ────────────────────────────────────────────────────

  async getPersonalRecords(userId: string) {
    const prs = await this.prisma.personalRecord.findMany({
      where: { userId },
      orderBy: { e1RM: 'desc' },
    });

    // Enrich with exercise names
    const exerciseIds = [...new Set(prs.map((pr) => pr.exerciseId))];
    const exercises = await this.prisma.exercise.findMany({
      where: { id: { in: exerciseIds } },
      select: { id: true, name: true, code: true },
    });
    const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

    return prs.map((pr) => ({
      ...pr,
      exercise: exerciseMap.get(pr.exerciseId) ?? null,
    }));
  }

  // ─── Weekly Volume per Muscle Group ────────────────────────────────────────
  // Total sets completed per major muscle group over the last N weeks

  async getVolumeByMuscle(userId: string, weeks: number = 4) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeks * 7);

    const logs = await this.prisma.performanceLog.findMany({
      where: { userId, sessionDate: { gte: cutoff }, completedSets: { gt: 0 } },
      include: {
        session: { select: { sessionDate: true, status: true } },
      },
    });

    // Get exercise→muscle mappings
    const exerciseIds = [...new Set(logs.map((l) => l.exerciseId))];
    const muscles = await this.prisma.exerciseMuscle.findMany({
      where: { exerciseId: { in: exerciseIds }, role: { in: ['primary', 'secondary'] } },
      include: { muscle: { select: { name: true, isMajor: true } } },
    });

    const muscleToExercises = new Map<string, Set<string>>();
    for (const em of muscles) {
      if (!em.muscle.isMajor) continue;
      const muscleName = em.muscle.name;
      if (!muscleToExercises.has(muscleName)) muscleToExercises.set(muscleName, new Set());
      muscleToExercises.get(muscleName)!.add(em.exerciseId);
    }

    // Aggregate sets per muscle per week
    const volumeByMuscleByWeek: Record<string, Record<string, number>> = {};

    for (const log of logs) {
      if (!log.session || log.session.status === 'missed') continue;

      const weekKey = this.getWeekKey(log.sessionDate);

      for (const [muscleName, exerciseSet] of muscleToExercises.entries()) {
        if (!exerciseSet.has(log.exerciseId)) continue;
        if (!volumeByMuscleByWeek[muscleName]) volumeByMuscleByWeek[muscleName] = {};
        volumeByMuscleByWeek[muscleName][weekKey] = (volumeByMuscleByWeek[muscleName][weekKey] ?? 0) + log.completedSets;
      }
    }

    // Flatten to array
    return Object.entries(volumeByMuscleByWeek).map(([muscle, weeks]) => ({
      muscle,
      weeks: Object.entries(weeks).map(([week, sets]) => ({ week, sets })).sort((a, b) => a.week.localeCompare(b.week)),
      totalSets: Object.values(weeks).reduce((s, v) => s + v, 0),
    }));
  }

  // ─── Strength Trend ───────────────────────────────────────────────────────
  // e1RM progression over time for a specific exercise

  async getStrengthTrend(userId: string, exerciseId: string, weeks: number = 8) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeks * 7);

    const logs = await this.prisma.performanceLog.findMany({
      where: { userId, exerciseId, sessionDate: { gte: cutoff }, estimatedE1RM: { not: null } },
      select: { sessionDate: true, estimatedE1RM: true, maxLoad: true },
      orderBy: { sessionDate: 'asc' },
    });

    return {
      exerciseId,
      dataPoints: logs.map((l) => ({
        date: l.sessionDate.toISOString().slice(0, 10),
        e1RM: l.estimatedE1RM,
        maxLoad: l.maxLoad,
      })),
      trend: this.computeLinearTrend(logs.map((l) => l.estimatedE1RM ?? 0)),
    };
  }

  // ─── Adherence Over Time ─────────────────────────────────────────────────

  async getAdherenceTrend(userId: string, planId: string, weeks: number = 8) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeks * 7);

    const sessions = await this.prisma.workoutSession.findMany({
      where: { userId, planId, sessionDate: { gte: cutoff } },
      select: { sessionDate: true, status: true },
      orderBy: { sessionDate: 'asc' },
    });

    const byWeek: Record<string, { completed: number; total: number }> = {};
    for (const s of sessions) {
      const week = this.getWeekKey(s.sessionDate);
      if (!byWeek[week]) byWeek[week] = { completed: 0, total: 0 };
      byWeek[week].total++;
      if (s.status === 'completed' || s.status === 'partial') byWeek[week].completed++;
    }

    return Object.entries(byWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, counts]) => ({
        week,
        completed: counts.completed,
        total: counts.total,
        rate: counts.total > 0 ? counts.completed / counts.total : 0,
      }));
  }

  // ─── RPE Trend ───────────────────────────────────────────────────────────

  async getRPETrend(userId: string, planId: string) {
    const sessions = await this.prisma.workoutSession.findMany({
      where: { userId, planId, rpeAverage: { not: null } },
      select: { sessionDate: true, rpeAverage: true },
      orderBy: { sessionDate: 'asc' },
    });

    return {
      dataPoints: sessions.map((s) => ({
        date: s.sessionDate.toISOString().slice(0, 10),
        rpe: s.rpeAverage,
      })),
      averageRPE: sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.rpeAverage ?? 0), 0) / sessions.length
        : null,
      trend: this.computeLinearTrend(sessions.map((s) => s.rpeAverage ?? 0)),
    };
  }

  // ─── Dashboard Summary ────────────────────────────────────────────────────

  async getDashboard(userId: string) {
    const [totalSessions, latestPR, recentSessions, activePlan] = await Promise.all([
      this.prisma.workoutSession.count({ where: { userId, status: 'completed' } }),

      this.prisma.personalRecord.findFirst({
        where: { userId },
        orderBy: { recordDate: 'desc' },
        include: { user: false },
      }),

      this.prisma.workoutSession.findMany({
        where: { userId },
        orderBy: { sessionDate: 'desc' },
        take: 5,
        select: { id: true, sessionDate: true, status: true, durationMinutes: true, rpeAverage: true, dayNumber: true },
      }),

      this.prisma.workoutPlan.findFirst({
        where: { userId, isActive: true },
        select: { id: true, programParameters: true, deloadTriggered: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const streakDays = await this.computeStreak(userId);

    return {
      totalCompletedSessions: totalSessions,
      currentStreak: streakDays,
      latestPR: latestPR ? { exerciseId: latestPR.exerciseId, e1RM: latestPR.e1RM, date: latestPR.recordDate } : null,
      recentSessions,
      activePlan,
    };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private getWeekKey(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay()); // Sunday start
    return d.toISOString().slice(0, 10);
  }

  // Slope of linear regression (positive = improving)
  private computeLinearTrend(values: number[]): 'improving' | 'declining' | 'stable' | null {
    if (values.length < 3) return null;
    const n = values.length;
    const meanX = (n - 1) / 2;
    const meanY = values.reduce((s, v) => s + v, 0) / n;
    const numerator = values.reduce((s, v, i) => s + (i - meanX) * (v - meanY), 0);
    const denominator = values.reduce((s, _, i) => s + Math.pow(i - meanX, 2), 0);
    const slope = denominator === 0 ? 0 : numerator / denominator;
    if (slope > 0.1) return 'improving';
    if (slope < -0.1) return 'declining';
    return 'stable';
  }

  // Current training streak (consecutive days with completed sessions)
  private async computeStreak(userId: string): Promise<number> {
    const sessions = await this.prisma.workoutSession.findMany({
      where: { userId, status: { in: ['completed', 'partial'] } },
      select: { sessionDate: true },
      orderBy: { sessionDate: 'desc' },
    });

    if (sessions.length === 0) return 0;

    let streak = 1;
    let prev = new Date(sessions[0].sessionDate);
    prev.setHours(0, 0, 0, 0);

    for (let i = 1; i < sessions.length; i++) {
      const curr = new Date(sessions[i].sessionDate);
      curr.setHours(0, 0, 0, 0);
      const diffDays = Math.round((prev.getTime() - curr.getTime()) / (86400 * 1000));
      if (diffDays <= 2) { // allow 1 rest day
        streak++;
        prev = curr;
      } else {
        break;
      }
    }

    return streak;
  }
}
