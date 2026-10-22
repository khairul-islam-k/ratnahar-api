import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, desc, eq, ilike, inArray } from 'drizzle-orm';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import type { Database } from 'src/database/database.types';
import {
  permissions,
  rolePermissions,
  roles,
  userRoles,
} from 'src/database/schema/rbc-permission';
import {
  apiResponse,
  paginatedResponse,
} from 'src/common/interceptors/response.interceptor';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignPermissionDto } from './dto/assign-permissions.dto';
import { AssignUserRoleDto } from './dto/assign-user-role.dto';

@Injectable()
export class RoleService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  async findAllByTenant(
    tenantId: string,
    page: number,
    limit: number,
    search?: string,
  ) {
    const where = and(
      eq(roles.tenantId, tenantId),
      search ? ilike(roles.name, `%${search}%`) : undefined,
    );
    const offset = (page - 1) * limit;

    const [rows, [totalResult]] = await Promise.all([
      this.db
        .select()
        .from(roles)
        .where(where)
        .orderBy(desc(roles.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(roles).where(where),
    ]);

    const total = totalResult.total;
    return paginatedResponse(
      rows,
      { page, limit, total, totalPages: Math.ceil(total / limit) },
      'Roles retrieved successfully',
    );
  }

  async create(dto: CreateRoleDto) {
    const [row] = await this.db
      .insert(roles)
      .values({
        tenantId: dto.tenantId ?? null,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        isSystemRole: dto.isSystemRole ?? false,
      })
      .onConflictDoNothing({ target: [roles.tenantId, roles.slug] })
      .returning();

    if (!row) {
      throw new ConflictException('A role with this tenant and slug already exists');
    }

    return apiResponse(row, 'Role created successfully');
  }

  async assignPermissions(assignments: AssignPermissionDto[]) {
    const roleIds = [...new Set(assignments.map(({ roleId }) => roleId))];
    const permissionIds = [
      ...new Set(assignments.map(({ permissionId }) => permissionId)),
    ];

    const [existingRoles, existingPermissions] = await Promise.all([
      this.db
        .select({ id: roles.id })
        .from(roles)
        .where(inArray(roles.id, roleIds)),
      this.db
        .select({ id: permissions.id })
        .from(permissions)
        .where(inArray(permissions.id, permissionIds)),
    ]);

    const existingRoleIds = new Set(existingRoles.map(({ id }) => id));
    const missingRoleIds = roleIds.filter((id) => !existingRoleIds.has(id));
    if (missingRoleIds.length) {
      throw new NotFoundException({
        message: 'One or more roles were not found',
        missingRoleIds,
      });
    }

    const existingPermissionIds = new Set(
      existingPermissions.map(({ id }) => id),
    );
    const missingPermissionIds = permissionIds.filter(
      (id) => !existingPermissionIds.has(id),
    );
    if (missingPermissionIds.length) {
      throw new NotFoundException({
        message: 'One or more permissions were not found',
        missingPermissionIds,
      });
    }

    const assignedRows = await this.db
      .insert(rolePermissions)
      .values(
        assignments.map(({ roleId, permissionId }) => ({
          roleId,
          permissionId,
        })),
      )
      .onConflictDoNothing({
        target: [rolePermissions.roleId, rolePermissions.permissionId],
      })
      .returning();

    return apiResponse(assignedRows, 'Permissions assigned to roles successfully');
  }

  async assignRoleToUser(dto: AssignUserRoleDto, userId: string) {
    const [existingRole] = await this.db
      .select({ id: roles.id })
      .from(roles)
      .where(inArray(roles.id, [dto.roleId]));

    if (!existingRole) {
      throw new NotFoundException({
        message: 'Role was not found',
        roleId: dto.roleId,
      });
    }

    const [assignedRow] = await this.db
      .insert(userRoles)
      .values({ userId, roleId: dto.roleId })
      .onConflictDoNothing({
        target: [userRoles.userId, userRoles.roleId],
      })
      .returning();

    return apiResponse(assignedRow ?? null, 'Role assigned to user successfully');
  }
}
