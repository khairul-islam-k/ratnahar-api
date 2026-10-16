// src/auth/strategies/refresh-token.strategy.ts

import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from '../types/jwt-payload.type';
import { Request } from 'express';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import type { Database } from 'src/database/database.types';
import { systemUser, SystemUserStatus } from 'src/database/schema/system';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly configService: ConfigService,
) {
    const jwtSecret = configService.get<string>('JWT_REFRESH_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT secret is Missing');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: JwtPayload) {
    const refreshToken = ExtractJwt.fromAuthHeaderAsBearerToken()(request);

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
      refreshToken,
      photo: user.photo,
    };
  }
}
