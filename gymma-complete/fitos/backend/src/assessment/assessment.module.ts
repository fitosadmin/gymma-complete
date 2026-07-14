import { Module } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { AssessmentController } from './assessment.controller';
import { VectorComputationService } from './vector-computation.service';

@Module({
  providers: [AssessmentService, VectorComputationService],
  controllers: [AssessmentController],
  exports: [VectorComputationService],
})
export class AssessmentModule {}
