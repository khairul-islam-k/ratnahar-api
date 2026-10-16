import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import type { Database } from 'src/database/database.types';
import { RegisterDto } from './dto/register.dto';
import {
  systemUser,
  SystemUserStatus,
  SystemUserType,
} from 'src/database/schema/system';
import { shop, ShopStatus } from 'src/database/schema/shop';
import bcrypt from 'bcrypt';
import { and, eq } from 'drizzle-orm';
import type { AuthUser, RefreshAuthUser } from './types/auth-user.type';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import type { JwtPayload } from './types/jwt-payload.type';
import { randomUUID } from 'node:crypto';

type tokenPayLoad = {
  sub: string;
  email: string;
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const [existingUser] = await this.db
      .select()
      .from(systemUser)
      .where(
        and(
          eq(systemUser.email, dto.email),
          eq(systemUser.status, SystemUserStatus.ACTIVE),
        ),
      );

    if (existingUser) {
      throw new ConflictException('email already exist');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const tenantId = randomUUID();

    return this.db.transaction(async (tx) => {
      const [tenant] = await tx
        .insert(systemUser)
        .values({
          id: tenantId,
          name: dto.name,
          email: dto.email,
          passwordHash,
          type: SystemUserType.TENANT,
          status: SystemUserStatus.ACTIVE,
          tenantId,
        })
        .returning();

      const [createdShop] = await tx
        .insert(shop)
        .values({
          tenantId: tenant.id,
          name: dto.businessName,
          email: dto.email,
          status: ShopStatus.ACTIVE,
        })
        .returning({ id: shop.id, name: shop.name, status: shop.status });

      return { ...tenant, shop: createdShop };
    });
  }

  async validateUser(email: string, password: string) {
    const [user] = await this.db
      .select()
      .from(systemUser)
      .where(
        and(
          eq(systemUser.email, email),
          eq(systemUser.status, SystemUserStatus.ACTIVE),
        ),
      );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatched = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatched) {
      throw new UnauthorizedException('Invalid email or password');
    }

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

  // ============================
  // LOGIN
  // ============================

  async login(user: AuthUser) {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    const tokens = await this.generateTokenPair(payload);

    // // Hash refresh token before database storage
    const tokenHash = await bcrypt.hash(tokens.refreshToken, 10);

    await this.db
      .update(systemUser)
      .set({
        refreshTokenHash: tokenHash,
      })
      .where(eq(systemUser.id, user.id));

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refreshToken(user: RefreshAuthUser) {
    const [existingUser] = await this.db
      .select()
      .from(systemUser)
      .where(
        and(
          eq(systemUser.email, user.email),
          eq(systemUser.status, SystemUserStatus.ACTIVE),
        ),
      );

      const payload = {
        sub: user.id,
        email: user.email,
      }

    if (!existingUser) {
      throw new UnauthorizedException('Invalid email account');
    }

    if (!existingUser.refreshTokenHash) {
      throw new UnauthorizedException(
        'Refresh token is invalid or user is logged out',
      );
    }

    const refreshTokenMatch =
      await bcrypt.compare(
        user.refreshToken,
        existingUser.refreshTokenHash,
      );

    if (!refreshTokenMatch) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

      const tokens = await this.generateTokenPair(payload)

      return tokens;

    }

  async logout(userId: string) {
      await this.db
        .update(systemUser)
        .set({
          refreshTokenHash: null,
        })
        .where(eq(systemUser.id, userId));

      return {
        message: 'logged out successfully',
      };
    }

  private async generateTokenPair(payload: tokenPayLoad) {
    const accessPayload: JwtPayload = {
      sub: payload.sub,
      email: payload.email,
      tokenType: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: payload.sub,
      email: payload.email,
      tokenType: 'refresh',
    };

    const accessExpiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '7m';

    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7m';

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: accessExpiresIn as JwtSignOptions['expiresIn'],
    });

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: refreshExpiresIn as JwtSignOptions['expiresIn'],
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
