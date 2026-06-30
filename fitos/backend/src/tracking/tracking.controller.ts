import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { TrackingService } from './tracking.service';
import { PlanAdaptationService } from './plan-adaptation.service';
import { LogSessionSchema, LogSessionDto, UpdateSessionSchema, UpdateSessionDto } from './dto/log-session.dto';
import { z } from 'zod';

const SessionQuerySchema = z.object({ planId: z.string().uuid().optional() });

@Controller('api/v1/tracking')
@UseGuards(JwtAuthGuard)
export class TrackingController {
  constructor(
    private tracking: TrackingService,
    private adaptation: PlanAdaptationService,
  ) {}

  @Post('sessions')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  logSession(
    @Body(new ZodValidationPipe(LogSessionSchema)) dto: LogSessionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tracking.logSession(user.sub, dto);
  }

  @Get('sessions')
  listSessions(
    @Query(new ZodValidationPipe(SessionQuerySchema)) q: { planId?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tracking.listSessions(user.sub, q.planId);
  }

  @Get('sessions/:id')
  getSession(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.tracking.getSession(id, user.sub);
  }

  @Patch('sessions/:id')
  updateSession(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSessionSchema)) dto: UpdateSessionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tracking.updateSession(id, user.sub, dto);
  }

  @Post('plans/:planId/adapt')
  adaptPlan(@Param('planId') planId: string, @CurrentUser() user: JwtPayload) {
    return this.adaptation.adaptPlan(user.sub, planId);
  }

  @Get('plans/:planId/suggestions')
  getSuggestions(@Param('planId') planId: string, @CurrentUser() user: JwtPayload) {
    return this.adaptation.getProgressionSuggestions(user.sub, planId);
  }

  @Get('plans/:planId/adherence')
  getAdherence(@Param('planId') planId: string, @CurrentUser() user: JwtPayload) {
    return this.adaptation.checkAdherence(user.sub, planId);
  }
}
