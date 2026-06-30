import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PlansService } from './plans.service';
import { GeneratePlanSchema, GeneratePlanDto } from './dto/generate-plan.dto';

@Controller('api/v1/plans')
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(private plansService: PlansService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  generatePlan(
    @Body(new ZodValidationPipe(GeneratePlanSchema)) dto: GeneratePlanDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.plansService.generatePlan(dto.assessmentId, user.sub);
  }

  @Get()
  listPlans(@CurrentUser() user: JwtPayload) {
    return this.plansService.listUserPlans(user.sub);
  }

  @Get(':planId')
  getPlan(@Param('planId') planId: string, @CurrentUser() user: JwtPayload) {
    return this.plansService.getPlan(planId, user.sub);
  }
}
