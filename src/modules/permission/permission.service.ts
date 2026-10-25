import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import type { Database } from 'src/database/database.types';
import {
  permissions,
  rolePermissions,
  userRoles,
} from 'src/database/schema/rbc-permission';
import { eq } from 'drizzle-orm';
import { apiResponse } from 'src/common/interceptors/response.interceptor';
import type { AuthUser } from '../auth/types/auth-user.type';
import { SystemUserType } from 'src/database/schema/system';

@Injectable()
export class PermissionService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}
  async create(createPermissionDto: CreatePermissionDto) {
    const [row] = await this.db
      .insert(permissions)
      .values(createPermissionDto)
      .onConflictDoNothing({
        target: [permissions.featureKey, permissions.actionKey],
      })
      .returning();

    if (!row) {
      throw new ConflictException(
        'A permission with this feature and action already exists',
      );
    }

    return apiResponse(row, 'Permission created successfully');
  }

  async findAll() {
    const rows = await this.db.select().from(permissions);
    return apiResponse(rows, 'Permissions retrieved successfully');
  }

  async myPermission(user: AuthUser) {
    const permission =
      user.type === SystemUserType.TENANT
        ? await this.findAll()
        : await this.getUserPermissions(user.id);
    return permission;
  }

  async getUserPermissions(userId: string) {
    const rows = await this.db
      .selectDistinct({
        id: permissions.id,
        featureKey: permissions.featureKey,
        actionKey: permissions.actionKey,
        description: permissions.description,
      })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
      .innerJoin(
        permissions,
        eq(rolePermissions.permissionId, permissions.id),
      )
      .where(eq(userRoles.userId, userId));

    return apiResponse(rows, 'User permissions retrieved successfully');
  }
}
