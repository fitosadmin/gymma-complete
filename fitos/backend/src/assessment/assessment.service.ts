import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VectorComputationService } from './vector-computation.service';
import { AssessmentSubmissionDto } from './dto/assessment-submission.dto';
import { AssessmentResponses } from './types/assessment.types';

@Injectable()
export class AssessmentService {
  constructor(
    private prisma: PrismaService,
    private vectorService: VectorComputationService,
  ) {}

  async submit(userId: string, dto: AssessmentSubmissionDto) {
    const responses = dto as AssessmentResponses;

    // ── Safety Gate: Doc 1 §0 — hard block on cardiovascular danger ──────────
    const safetyFlags = this.vectorService.computeSafetyFlags(responses);
    if (safetyFlags.includes('MEDICAL_CLEARANCE_REQUIRED')) {
      // Still create the assessment but mark it blocked
      const blockedVector = {
        Goal_Alignment: 0,
        Recovery_Capacity: 0,
        Mobility_Score: 0,
        Strength_Level: 0,
        Experience_Score: 0,
        Availability_Score: 0,
        Injury_Risk: 100,
        Preference_Alignment: 50,
      };

      const assessment = await this.prisma.assessment.create({
        data: {
          userId,
          responses: responses as any,
          computedVector: blockedVector as any,
          experienceScore: 0,
          safetyFlags: safetyFlags as any,
        },
      });

      throw new BadRequestException({
        errorCode: 'MEDICAL_CLEARANCE_REQUIRED',
        message:
          'Medical clearance required. S0_Q2 or S0_Q3 indicates cardiovascular risk. ' +
          'No load-bearing recommendations can be generated. ' +
          'A mobility-only track is available.',
        assessmentId: assessment.id,
        safetyFlags,
        mobilityOnlyTrackAvailable: true,
      });
    }

    // ── Compute User Fitness Profile Vector ──────────────────────────────────
    const vector = this.vectorService.computeUserVector(responses);
    const experienceScore = Math.round(vector.Experience_Score);

    const assessment = await this.prisma.assessment.create({
      data: {
        userId,
        responses: responses as any,
        computedVector: vector as any,
        experienceScore,
        safetyFlags: safetyFlags as any,
      },
    });

    return {
      assessmentId: assessment.id,
      computedVector: vector,
      experienceScore,
      safetyFlags,
      branchingDecisions: {
        showMobilitySection: experienceScore >= 20,
        showPreferencesSection: experienceScore >= 35,
        forcedSplit: experienceScore < 20 ? 'Full Body' : null,
        forcedFrequencyMax: experienceScore < 20 ? 3 : null,
      },
    };
  }

  async findById(assessmentId: string, userId: string) {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, userId },
    });

    if (!assessment) {
      throw new NotFoundException({ errorCode: 'ASSESSMENT_NOT_FOUND', message: 'Assessment not found' });
    }

    return assessment;
  }

  async recalculateVector(assessmentId: string, userId: string) {
    const assessment = await this.findById(assessmentId, userId);

    const responses = assessment.responses as unknown as AssessmentResponses;
    const safetyFlags = this.vectorService.computeSafetyFlags(responses);
    const vector = this.vectorService.computeUserVector(responses);
    const experienceScore = Math.round(vector.Experience_Score);

    const updated = await this.prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        computedVector: vector as any,
        experienceScore,
        safetyFlags: safetyFlags as any,
      },
    });

    return {
      assessmentId: updated.id,
      computedVector: vector,
      experienceScore,
      safetyFlags,
    };
  }
}
