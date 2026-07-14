import { Controller, Post, Get, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AssessmentSubmissionSchema, AssessmentSubmissionDto } from './dto/assessment-submission.dto';

@Controller('api/v1/assessments')
@UseGuards(JwtAuthGuard)
export class AssessmentController {
  constructor(private assessmentService: AssessmentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  submit(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(AssessmentSubmissionSchema)) dto: AssessmentSubmissionDto,
  ) {
    return this.assessmentService.submit(user.sub, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.assessmentService.findById(id, user.sub);
  }

  @Post(':id/vector')
  @HttpCode(HttpStatus.OK)
  recalculate(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.assessmentService.recalculateVector(id, user.sub);
  }
}
