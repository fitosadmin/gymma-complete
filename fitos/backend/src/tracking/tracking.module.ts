import { Module } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { PlanAdaptationService } from './plan-adaptation.service';

@Module({
  providers: [TrackingService, PlanAdaptationService],
  controllers: [TrackingController],
  exports: [PlanAdaptationService],
})
export class TrackingModule {}
