import { Module } from '@nestjs/common';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { ExerciseMatcherService } from './exercise-matcher.service';
import { RecommendationEngineService } from './recommendation-engine.service';
import { AssessmentModule } from '../assessment/assessment.module';

@Module({
  imports: [AssessmentModule],
  providers: [PlansService, ExerciseMatcherService, RecommendationEngineService],
  controllers: [PlansController],
})
export class PlansModule {}
