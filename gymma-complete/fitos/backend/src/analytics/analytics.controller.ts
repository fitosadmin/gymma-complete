import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AnalyticsService } from './analytics.service';

const WeeksQuerySchema = z.object({
  weeks: z.coerce.number().int().min(1).max(52).default(4),
});

const StrengthTrendQuerySchema = z.object({
  exerciseId: z.string().uuid(),
  weeks: z.coerce.number().int().min(1).max(52).default(8),
});

@Controller('api/v1/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: JwtPayload) {
    return this.analytics.getDashboard(user.sub);
  }

  @Get('prs')
  getPersonalRecords(@CurrentUser() user: JwtPayload) {
    return this.analytics.getPersonalRecords(user.sub);
  }

  @Get('volume')
  getVolume(
    @Query(new ZodValidationPipe(WeeksQuerySchema)) q: { weeks: number },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.analytics.getVolumeByMuscle(user.sub, q.weeks);
  }

  @Get('strength')
  getStrengthTrend(
    @Query(new ZodValidationPipe(StrengthTrendQuerySchema)) q: { exerciseId: string; weeks: number },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.analytics.getStrengthTrend(user.sub, q.exerciseId, q.weeks);
  }

  @Get('plans/:planId/adherence')
  getAdherence(
    @Param('planId') planId: string,
    @Query(new ZodValidationPipe(WeeksQuerySchema)) q: { weeks: number },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.analytics.getAdherenceTrend(user.sub, planId, q.weeks);
  }

  @Get('plans/:planId/rpe')
  getRPETrend(@Param('planId') planId: string, @CurrentUser() user: JwtPayload) {
    return this.analytics.getRPETrend(user.sub, planId);
  }
}
