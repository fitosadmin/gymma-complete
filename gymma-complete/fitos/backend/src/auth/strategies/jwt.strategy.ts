import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private redis: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('jwt.secret'),
      algorithms: ['HS256'],
      passReqToCallback: false,
    });
  }

  async validate(payload: any): Promise<JwtPayload> {
    // The Express app payload might not have `type` or `jti`, so we must be flexible
    // Gymma express issues payload: { userId, role, email }
    
    // Normalize sub and userId depending on who issued the token
    const userId = payload.sub || payload.userId;
    
    if (!userId) {
      throw new UnauthorizedException('Token payload invalid: missing subject/userId');
    }

    return { 
      sub: userId, 
      email: payload.email, 
      jti: payload.jti || 'legacy-no-jti', 
      type: payload.type || 'access' 
    };
  }
}
