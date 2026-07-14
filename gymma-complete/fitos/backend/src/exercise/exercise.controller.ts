import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ExerciseService } from './exercise.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ExerciseFilterSchema, ExerciseFilterDto } from './dto/exercise-filter.dto';

@Controller('api/v1')
@UseGuards(JwtAuthGuard)
export class ExerciseController {
  constructor(private exerciseService: ExerciseService) {}

  @Get('exercises')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  findAll(@Query(new ZodValidationPipe(ExerciseFilterSchema)) filter: ExerciseFilterDto) {
    return this.exerciseService.findAll(filter);
  }

  @Get('exercises/:id')
  findOne(@Param('id') id: string) {
    return this.exerciseService.findById(id);
  }

  @Get('gyms/:gymId/exercises')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  findByGym(
    @Param('gymId') gymId: string,
    @Query(new ZodValidationPipe(ExerciseFilterSchema)) filter: ExerciseFilterDto,
  ) {
    return this.exerciseService.findByGym(gymId, filter);
  }
}
