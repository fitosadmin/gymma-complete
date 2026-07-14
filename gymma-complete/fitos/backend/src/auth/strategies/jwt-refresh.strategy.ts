import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { RedisService } from '../../redis/redis.service';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    config: ConfigService,
    private redis: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      secretOrKey: config.get<string>('jwt.secret'),
      algorithms: ['HS256'],
      passReqToCallback: false,
    });
  }

  async validate(payload: any): Promise<JwtPayload> {
    const userId = payload.sub || payload.userId;
    if (!userId) {
      throw new UnauthorizedException('Invalid token payload: missing userId');
    }

    if (payload.type && payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    if (payload.jti) {
      const isBlacklisted = await this.redis.exists(`blacklist:${payload.jti}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }
    }

    return { sub: userId, email: payload.email, jti: payload.jti || 'legacy-no-jti', type: 'refresh' };
  }
}
