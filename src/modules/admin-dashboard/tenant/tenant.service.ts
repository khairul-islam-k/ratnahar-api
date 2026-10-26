import {
  ConflictException,
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
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
import { shop, ShopStatus } from 'src/database/schema/shop';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';

@Injectable()
export class TenantService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}
  async create(dto: CreateTenantDto) {
    await this.validateUniqueContact(dto.email, dto.phone);

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const tenantId = randomUUID();

    try {
      const result = await this.db.transaction(async (tx) => {
        const [tenant] = await tx
          .insert(systemUser)
          .values({
            id: tenantId,
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            photo: dto.photo,
            passwordHash,
            type: SystemUserType.TENANT,
            status: SystemUserStatus.ACTIVE,
            tenantId,
          })
          .returning({
            id: systemUser.id,
            name: systemUser.name,
            email: systemUser.email,
            phone: systemUser.phone,
            photo: systemUser.photo,
            type: systemUser.type,
            status: systemUser.status,
            createdAt: systemUser.createdAt,
          });

        const [createdShop] = await tx
          .insert(shop)
          .values({
            tenantId: tenant.id,
            name: dto.businessName,
            email: dto.email,
            phone: dto.phone,
            status: ShopStatus.ACTIVE,
          })
          .returning({ id: shop.id, name: shop.name, status: shop.status });

        return { ...tenant, shop: createdShop };
      });

      return apiResponse(result, 'Tenant created successfully');
    } catch (error) {
      const dbError = error as {
        code?: string;
        constraint?: string;
        cause?: { code?: string; constraint?: string };
      };
      if (dbError?.code === '23505' || dbError?.cause?.code === '23505') {
        const constraint = dbError.constraint ?? dbError.cause?.constraint ?? '';
        const errors: { email?: string; phone?: string } = {};
        if (constraint.includes('email')) errors.email = 'Email is already in use';
        if (constraint.includes('phone')) errors.phone = 'Phone number is already in use';
        if (!Object.keys(errors).length) {
          errors.email = 'Email may already be in use';
          errors.phone = 'Phone number may already be in use';
        }
        throw new ConflictException({
          message: 'Email or phone number is already in use',
          errors,
        });
      }
      throw error;
    }
  }

  async findAll(options: {
    page: number;
    limit: number;
    search?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  }) {
    const conditions = [
      eq(systemUser.type, SystemUserType.TENANT),
      isNull(systemUser.deletedAt),
    ];

    if (options.status) conditions.push(eq(systemUser.status, options.status));
    if (options.search?.trim()) {
      const term = `%${options.search.trim()}%`;
      conditions.push(
        or(
          ilike(systemUser.name, term),
          ilike(systemUser.email, term),
          ilike(systemUser.phone, term),
        )!,
      );
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

    return paginatedResponse(
      rows,
      {
        page: options.page,
        limit: options.limit,
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / options.limit),
      },
      'Tenants retrieved successfully',
    );
  }

  async findOne(id: string) {
    const [tenant] = await this.db
      .select({
        id: systemUser.id,
        name: systemUser.name,
        email: systemUser.email,
        phone: systemUser.phone,
        type: systemUser.type,
        status: systemUser.status,
        emailVerifiedAt: systemUser.emailVerifiedAt,
        photo: systemUser.photo,
        tenantId: systemUser.tenantId,
        createdById: systemUser.createdById,
        updatedById: systemUser.updatedById,
        deletedById: systemUser.deletedById,
        createdAt: systemUser.createdAt,
        updatedAt: systemUser.updatedAt,
        deletedAt: systemUser.deletedAt,
      })
      .from(systemUser)
      .where(and(
        eq(systemUser.id, id),
        eq(systemUser.type, SystemUserType.TENANT),
        isNull(systemUser.deletedAt),
      ));

    if (!tenant) throw new NotFoundException('Tenant not found');

    const [tenantShop] = await this.db
      .select({ businessName: shop.name })
      .from(shop)
      .where(eq(shop.tenantId, id))
      .limit(1);

    return apiResponse(
      { ...tenant, businessName: tenantShop?.businessName ?? null },
      'Tenant retrieved successfully',
    );
  }

  async update(id: string, dto: UpdateTenantDto) {
    if (!Object.values(dto).some((value) => value !== undefined)) {
      throw new BadRequestException('At least one field must be provided');
    }

    const [existingTenant] = await this.db
      .select({ id: systemUser.id })
      .from(systemUser)
      .where(and(
        eq(systemUser.id, id),
        eq(systemUser.type, SystemUserType.TENANT),
        isNull(systemUser.deletedAt),
      ));
    if (!existingTenant) throw new NotFoundException('Tenant not found');

    await this.validateUniqueContact(dto.email, dto.phone, id);

    const { businessName, ...userChanges } = dto;
    const changes: Partial<typeof systemUser.$inferInsert> = { ...userChanges };

    const result = await this.db.transaction(async (tx) => {
      const tenantSelection = {
          id: systemUser.id,
          name: systemUser.name,
          email: systemUser.email,
          phone: systemUser.phone,
          photo: systemUser.photo,
          type: systemUser.type,
          status: systemUser.status,
          updatedAt: systemUser.updatedAt,
      };
      const tenantWhere = and(
        eq(systemUser.id, id),
        eq(systemUser.type, SystemUserType.TENANT),
        isNull(systemUser.deletedAt),
      );
      const [tenant] = Object.keys(changes).length
        ? await tx.update(systemUser).set(changes).where(tenantWhere).returning(tenantSelection)
        : await tx.select(tenantSelection).from(systemUser).where(tenantWhere);
      if (!tenant) throw new NotFoundException('Tenant not found');

      const shopChanges: Partial<typeof shop.$inferInsert> = {};
      if (businessName !== undefined) shopChanges.name = businessName;
      if (dto.email !== undefined) shopChanges.email = dto.email;
      if (dto.phone !== undefined) shopChanges.phone = dto.phone;

      let updatedShop;
      if (Object.keys(shopChanges).length) {
        [updatedShop] = await tx
          .update(shop)
          .set(shopChanges)
          .where(eq(shop.tenantId, id))
          .returning({ id: shop.id, name: shop.name, email: shop.email, phone: shop.phone });
      }

      return { ...tenant, ...(updatedShop && { shop: updatedShop }) };
    });

    return apiResponse(result, 'Tenant updated successfully');
  }

  private async validateUniqueContact(
    email?: string,
    phone?: string,
    excludeTenantId?: string,
  ) {
    const conditions: SQL[] = [];
    if (email) conditions.push(eq(systemUser.email, email));
    if (phone) conditions.push(eq(systemUser.phone, phone));
    if (!conditions.length) return;

    const matches = await this.db
      .select({ email: systemUser.email, phone: systemUser.phone })
      .from(systemUser)
      .where(
        and(
          or(...conditions),
          excludeTenantId ? ne(systemUser.id, excludeTenantId) : undefined,
        ),
      );

    const errors: { email?: string; phone?: string } = {};
    if (email && matches.some((row) => row.email === email)) {
      errors.email = 'Email is already in use';
    }
    if (phone && matches.some((row) => row.phone === phone)) {
      errors.phone = 'Phone number is already in use';
    }
    if (Object.keys(errors).length) {
      throw new ConflictException({
        message: 'Email or phone number is already in use',
        errors,
      });
    }
  }
}
