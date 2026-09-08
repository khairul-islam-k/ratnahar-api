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
import bcrypt from 'bcrypt';
import { and, eq } from 'drizzle-orm';
import type { AuthUser } from './types/auth-user.type';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';

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

    const result = await this.db
      .insert(systemUser)
      .values({
        name: dto.name,
        email: dto.email,
        passwordHash,
        type: SystemUserType.TENANT,
        status: SystemUserStatus.ACTIVE,
      })
      .returning();

    return result[0];
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
    console.log('token', tokens);

    // // Hash refresh token before database storage
    const tokenHash = await bcrypt.hash(tokens.refreshToken, 12);


  //   await this.db
  // .update(systemUser)
  // .set({
  
  // })
  // .where(eq(users.id, 1))

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private async generateTokenPair(payload: tokenPayLoad) {
    const accessPayload = {
      sub: payload.sub,
      email: payload.email,
      tokenType: 'access',
    };

    const refreshPayload = {
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
