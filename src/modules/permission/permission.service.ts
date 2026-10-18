import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import type { Database } from 'src/database/database.types';
import { permissions } from 'src/database/schema/rbc-permission';
import { apiResponse } from 'src/common/interceptors/response.interceptor';

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

  findOne(id: number) {
    return `This action returns a #${id} permission`;
  }

  update(id: number, updatePermissionDto: UpdatePermissionDto) {
    return `This action updates a #${id} permission`;
  }

  remove(id: number) {
    return `This action removes a #${id} permission`;
  }
}
