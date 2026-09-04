import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import type { Database } from 'src/database/database.types';
import { RegisterDto } from './dto/register.dto';
import {
  systemUser,
  SystemUserStatus,
  SystemUserType,
} from 'src/database/schema/system';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  async register(dto: RegisterDto) {
    console.log('dto', dto);

    const result = await this.db
      .insert(systemUser)
      .values({
        name: dto.name,
        email: dto.email,
        passwordHash: dto.password,
        type: SystemUserType.TENANT,
        status: SystemUserStatus.ACTIVE,
      })
      .returning();

    return result[0];
  }
}
