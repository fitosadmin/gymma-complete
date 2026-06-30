import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ExerciseFilterDto } from './dto/exercise-filter.dto';

const FULL_EXERCISE_INCLUDE = {
  muscles: { include: { muscle: true } },
  equipment: { include: { equipment: true } },
  contraindications: { include: { contraindication: true } },
  progressionsFrom: {
    include: {
      toExercise: {
        select: { id: true, code: true, name: true, difficultyScore: true },
      },
    },
  },
  progressionsTo: {
    include: {
      fromExercise: {
        select: { id: true, code: true, name: true, difficultyScore: true },
      },
    },
  },
} as const;

@Injectable()
export class ExerciseService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter: ExerciseFilterDto) {
    const where: Prisma.ExerciseWhereInput = {};

    if (filter.pattern) {
      where.primaryPattern = filter.pattern as any;
    }
    if (filter.difficultyMin !== undefined || filter.difficultyMax !== undefined) {
      where.difficultyScore = {
        ...(filter.difficultyMin !== undefined ? { gte: filter.difficultyMin } : {}),
        ...(filter.difficultyMax !== undefined ? { lte: filter.difficultyMax } : {}),
      };
    }
    if (filter.jointComplexity) {
      where.jointComplexity = filter.jointComplexity as any;
    }
    if (filter.experienceMax !== undefined) {
      where.experienceMinimum = { lte: filter.experienceMax };
    }
    if (filter.muscle) {
      where.muscles = {
        some: {
          muscle: { name: { contains: filter.muscle, mode: 'insensitive' } },
        },
      };
    }
    if (filter.equipment) {
      where.equipment = {
        some: {
          equipment: { code: filter.equipment as any },
        },
      };
    }
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { displayName: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
        { code: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const skip = (filter.page - 1) * filter.limit;

    const [total, exercises] = await Promise.all([
      this.prisma.exercise.count({ where }),
      this.prisma.exercise.findMany({
        where,
        include: {
          muscles: { include: { muscle: true } },
          equipment: { include: { equipment: true } },
        },
        orderBy: { difficultyScore: 'asc' },
        skip,
        take: filter.limit,
      }),
    ]);

    return {
      data: exercises,
      pagination: {
        total,
        page: filter.page,
        limit: filter.limit,
        totalPages: Math.ceil(total / filter.limit),
      },
    };
  }

  async findById(exerciseId: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: FULL_EXERCISE_INCLUDE,
    });

    if (!exercise) {
      throw new NotFoundException({ errorCode: 'EXERCISE_NOT_FOUND', message: 'Exercise not found' });
    }

    return exercise;
  }

  async findByGym(gymId: string, filter: ExerciseFilterDto) {
    const where: Prisma.ExerciseWhereInput = {
      gymAvailabilities: {
        some: { gymId, isAvailable: true },
      },
    };

    if (filter.pattern) where.primaryPattern = filter.pattern as any;
    if (filter.difficultyMin !== undefined || filter.difficultyMax !== undefined) {
      where.difficultyScore = {
        ...(filter.difficultyMin !== undefined ? { gte: filter.difficultyMin } : {}),
        ...(filter.difficultyMax !== undefined ? { lte: filter.difficultyMax } : {}),
      };
    }
    if (filter.experienceMax !== undefined) {
      where.experienceMinimum = { lte: filter.experienceMax };
    }
    if (filter.muscle) {
      where.muscles = { some: { muscle: { name: { contains: filter.muscle, mode: 'insensitive' } } } };
    }
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { code: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const skip = (filter.page - 1) * filter.limit;
    const [total, exercises] = await Promise.all([
      this.prisma.exercise.count({ where }),
      this.prisma.exercise.findMany({
        where,
        include: { muscles: { include: { muscle: true } }, equipment: { include: { equipment: true } } },
        orderBy: { difficultyScore: 'asc' },
        skip,
        take: filter.limit,
      }),
    ]);

    return {
      data: exercises,
      pagination: { total, page: filter.page, limit: filter.limit, totalPages: Math.ceil(total / filter.limit) },
    };
  }
}
