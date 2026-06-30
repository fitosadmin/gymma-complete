import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const DEFAULT_GYM_ID = 'default-gym-000000000000';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private redis: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException({ errorCode: 'EMAIL_TAKEN', message: 'Email already registered' });
    }

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    const gymId = dto.gymId ?? DEFAULT_GYM_ID;

    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, gymId },
      select: { id: true, email: true, gymId: true, createdAt: true },
    });

    const tokens = await this.generateTokenPair(user.id, user.email ?? '');
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException({ errorCode: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException({ errorCode: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    const tokens = await this.generateTokenPair(user.id, user.email ?? '');
    return {
      user: { id: user.id, email: user.email, gymId: user.gymId, createdAt: user.createdAt },
      ...tokens,
    };
  }

  async refresh(userId: string, email: string, oldJti: string) {
    // Blacklist old refresh token
    await this.redis.set(`blacklist:${oldJti}`, '1', 60 * 60 * 24 * 7);
    return this.generateTokenPair(userId, email);
  }

  async logout(accessJti: string, refreshJti?: string) {
    // Blacklist access token (15 min TTL)
    await this.redis.set(`blacklist:${accessJti}`, '1', 60 * 15);
    if (refreshJti) {
      await this.redis.set(`blacklist:${refreshJti}`, '1', 60 * 60 * 24 * 7);
    }
  }

  private async generateTokenPair(userId: string, email: string) {
    const accessJti = randomUUID();
    const refreshJti = randomUUID();

    const secret = this.config.get<string>('jwt.secret');
    const accessExpiresIn = this.config.get<string>('jwt.accessExpiresIn');
    const refreshExpiresIn = this.config.get<string>('jwt.refreshExpiresIn');

    const accessToken = this.jwt.sign(
      { sub: userId, email, jti: accessJti, type: 'access' },
      { secret, algorithm: 'HS256', expiresIn: accessExpiresIn },
    );

    const refreshToken = this.jwt.sign(
      { sub: userId, email, jti: refreshJti, type: 'refresh' },
      { secret, algorithm: 'HS256', expiresIn: refreshExpiresIn },
    );

    return { accessToken, refreshToken };
  }
}
