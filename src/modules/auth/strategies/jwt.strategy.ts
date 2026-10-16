import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from '../types/jwt-payload.type';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import type { Database } from 'src/database/database.types';
import { systemUser, SystemUserStatus } from 'src/database/schema/system';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly configService: ConfigService,
  ) {
    const jwtSecret = configService.get<string>('JWT_ACCESS_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT secret is Missing');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    const [user] = await this.db
      .select()
      .from(systemUser)
      .where(
        and(
          eq(systemUser.email, payload.email),
          eq(systemUser.status, SystemUserStatus.ACTIVE),
        ),
      );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      type: user.type,
      tenantId: user.tenantId,
      photo: user.photo,
    };
  }
}
