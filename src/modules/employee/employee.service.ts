import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateEmployeeStatusDto } from './dto/update-employee-status.dto';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import type { Database } from 'src/database/database.types';
import {
  systemUser,
  SystemUserStatus,
  SystemUserType,
} from 'src/database/schema/system';
import {
  apiResponse,
  paginatedResponse,
} from 'src/common/interceptors/response.interceptor';
import bcrypt from 'bcrypt';
import {
  and,
  count,
  desc,
  eq,
  ilike,
  isNull,
  ne,
  or,
  type SQL,
} from 'drizzle-orm';

@Injectable()
export class EmployeeService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}
  async create(
    dto: CreateEmployeeDto,
    tenantId: string,
    createdById: string,
  ) {
    await this.ensureUniqueContact(dto.email, dto.phone);
    const passwordHash = await bcrypt.hash(dto.password, 12);

    try {
      const [employee] = await this.db
        .insert(systemUser)
        .values({
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          type: SystemUserType.EMPLOYEE,
          status: SystemUserStatus.ACTIVE,
          photo: dto.photo,
          tenantId,
          createdById,
          updatedById: createdById,
        })
        .returning({
          id: systemUser.id,
          name: systemUser.name,
          email: systemUser.email,
          phone: systemUser.phone,
          type: systemUser.type,
          status: systemUser.status,
          photo: systemUser.photo,
          tenantId: systemUser.tenantId,
          createdAt: systemUser.createdAt,
        });
      return apiResponse(employee, 'Employee created successfully');
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Email or phone number is already in use');
      }
      throw error;
    }
  }

  async findAll(
    tenantId: string,
    options: { page: number; limit: number; search?: string; status?: string },
  ) {
    const conditions = [
      eq(systemUser.tenantId, tenantId),
      eq(systemUser.type, SystemUserType.EMPLOYEE),
      isNull(systemUser.deletedAt),
    ];

    if (options.status) conditions.push(eq(systemUser.status, options.status as typeof SystemUserStatus[keyof typeof SystemUserStatus]));
    if (options.search?.trim()) {
      const term = `%${options.search.trim()}%`;
      conditions.push(or(ilike(systemUser.name, term), ilike(systemUser.email, term), ilike(systemUser.phone, term))!);
    }
    
    const where = and(...conditions);
    const offset = (options.page - 1) * options.limit;
    const [rows, [totalResult]] = await Promise.all([
      this.db
        .select({
          id: systemUser.id,
          name: systemUser.name,
          email: systemUser.email,
          phone: systemUser.phone,
          type: systemUser.type,
          status: systemUser.status,
          photo: systemUser.photo,
          tenantId: systemUser.tenantId,
          createdAt: systemUser.createdAt,
          updatedAt: systemUser.updatedAt,
        })
        .from(systemUser)
        .where(where)
        .orderBy(desc(systemUser.createdAt))
        .limit(options.limit)
        .offset(offset),
      this.db.select({ total: count() }).from(systemUser).where(where),
    ]);
    const total = totalResult.total;
    return paginatedResponse(
      rows,
      {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
      'Employees retrieved successfully',
    );
  }

  async findOne(id: string, tenantId: string) {
    const [row] = await this.db
      .select({
        id: systemUser.id,
        name: systemUser.name,
        email: systemUser.email,
        phone: systemUser.phone,
        type: systemUser.type,
        status: systemUser.status,
        photo: systemUser.photo,
        tenantId: systemUser.tenantId,
        createdAt: systemUser.createdAt,
        updatedAt: systemUser.updatedAt,
      })
      .from(systemUser)
      .where(
        and(
          eq(systemUser.id, id),
          eq(systemUser.tenantId, tenantId),
          eq(systemUser.type, SystemUserType.EMPLOYEE),
          isNull(systemUser.deletedAt),
        ),
      )
      .limit(1);
    if (!row) throw new NotFoundException('Employee not found');
    return apiResponse(row, 'Employee retrieved successfully');
  }

  async update(id: string, dto: UpdateEmployeeDto, tenantId: string, updatedById: string) {
    const [existing] = await this.db.select({ id: systemUser.id }).from(systemUser).where(and(
      eq(systemUser.id, id), eq(systemUser.tenantId, tenantId),
      eq(systemUser.type, SystemUserType.EMPLOYEE), isNull(systemUser.deletedAt),
    )).limit(1);
    if (!existing) throw new NotFoundException('Employee not found');
    const { password, ...userFields } = dto;
    await this.ensureUniqueContact(userFields.email, userFields.phone, id);
    const userUpdate: Record<string, any> = { updatedById };
    for (const field of ['name', 'email', 'phone', 'photo'] as const) {
      if (userFields[field] !== undefined) userUpdate[field] = userFields[field];
    }
    if (password) userUpdate.passwordHash = await bcrypt.hash(password, 12);
    try {
      const [updated] = await this.db
        .update(systemUser)
        .set(userUpdate)
        .where(
          and(
            eq(systemUser.id, id),
            eq(systemUser.tenantId, tenantId),
            isNull(systemUser.deletedAt),
          ),
        )
        .returning({ id: systemUser.id });
      if (!updated) throw new NotFoundException('Employee not found');
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Email or phone number is already in use');
      }
      throw error;
    }
    return this.findOne(id, tenantId);
  }

  async updateStatus(
    id: string,
    dto: UpdateEmployeeStatusDto,
    tenantId: string,
    updatedById: string,
  ) {
    const [employee] = await this.db
      .update(systemUser)
      .set({ status: dto.status, updatedById })
      .where(
        and(
          eq(systemUser.id, id),
          eq(systemUser.tenantId, tenantId),
          eq(systemUser.type, SystemUserType.EMPLOYEE),
          isNull(systemUser.deletedAt),
        ),
      )
      .returning({ id: systemUser.id });

    if (!employee) throw new NotFoundException('Employee not found');
    return apiResponse(employee.id, "status update successfully");
  }

  async remove(id: string, tenantId: string, deletedById: string) {
    const [row] = await this.db.update(systemUser).set({ deletedAt: new Date(), deletedById })
      .where(and(eq(systemUser.id, id), eq(systemUser.tenantId, tenantId), eq(systemUser.type, SystemUserType.EMPLOYEE), isNull(systemUser.deletedAt)))
      .returning({ id: systemUser.id });
    if (!row) throw new NotFoundException('Employee not found');
    return { message: 'Employee deleted successfully' };
  }

  private async ensureUniqueContact(
    email?: string,
    phone?: string,
    excludeId?: string,
  ) {
    const checks: SQL[] = [];
    if (email) checks.push(eq(systemUser.email, email));
    if (phone) checks.push(eq(systemUser.phone, phone));
    if (!checks.length) return;

    const rows = await this.db
      .select({ id: systemUser.id, email: systemUser.email, phone: systemUser.phone })
      .from(systemUser)
      .where(
        and(or(...checks), excludeId ? ne(systemUser.id, excludeId) : undefined),
      );

    if (email && rows.some((row) => row.email === email)) {
      throw new ConflictException('Email is already in use');
    }
    if (phone && rows.some((row) => row.phone === phone)) {
      throw new ConflictException('Phone number is already in use');
    }
  }

  private isUniqueConstraintError(error: unknown) {
    const dbError = error as {
      code?: string;
      cause?: { code?: string };
    };
    return dbError?.code === '23505' || dbError?.cause?.code === '23505';
  }
}
