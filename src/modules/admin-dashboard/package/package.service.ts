import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import type { Database } from 'src/database/database.types';
import {
  packageLimits,
  packageModules,
  packages,
} from 'src/database/schema/subscription';
import { apiResponse } from 'src/common/interceptors/response.interceptor';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackageService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  async create(dto: CreatePackageDto) {
    const result = await this.db.transaction(async (tx) => {
      const [createdPackage] = await tx
        .insert(packages)
        .values({
          name: dto.name,
          slug: dto.slug,
          pricingType: dto.pricingType,
          monthlyPrice: dto.monthlyPrice,
          yearlyPrice: dto.yearlyPrice,
          description: dto.description,
          status: dto.status,
        })
        .onConflictDoNothing({ target: packages.slug })
        .returning();

      if (!createdPackage) {
        throw new ConflictException('A package with this slug already exists');
      }

      const createdModules = dto.modules?.length
        ? await tx
            .insert(packageModules)
            .values(
              dto.modules.map((module) => ({
                packageId: createdPackage.id,
                moduleKey: module.moduleKey,
                isEnabled: module.isEnabled,
              })),
            )
            .returning()
        : [];

      const createdLimits = dto.limits?.length
        ? await tx
            .insert(packageLimits)
            .values(
              dto.limits.map((limit) => ({
                packageId: createdPackage.id,
                limitKey: limit.limitKey,
                limitValue: limit.limitValue,
              })),
            )
            .returning()
        : [];

      return { ...createdPackage, modules: createdModules, limits: createdLimits };
    });

    return apiResponse(result, 'Package created successfully');
  }

  async findAll() {
    const packageRows = await this.db.select().from(packages);
    if (packageRows.length === 0) {
      return apiResponse([], 'Packages retrieved successfully');
    }

    const packageIds = packageRows.map((packageRow) => packageRow.id);
    const [moduleRows, limitRows] = await Promise.all([
      this.db
        .select()
        .from(packageModules)
        .where(inArray(packageModules.packageId, packageIds)),
      this.db
        .select()
        .from(packageLimits)
        .where(inArray(packageLimits.packageId, packageIds)),
    ]);

    const result = packageRows.map((packageRow) => ({
      ...packageRow,
      modules: moduleRows.filter((module) => module.packageId === packageRow.id),
      limits: limitRows.filter((limit) => limit.packageId === packageRow.id),
    }));

    return apiResponse(result, 'Packages retrieved successfully');
  }

  async findOne(id: string) {
    const [packageRow] = await this.db
      .select()
      .from(packages)
      .where(eq(packages.id, id));

    if (!packageRow) throw new NotFoundException('Package not found');

    const [moduleRows, limitRows] = await Promise.all([
      this.db
        .select()
        .from(packageModules)
        .where(eq(packageModules.packageId, id)),
      this.db
        .select()
        .from(packageLimits)
        .where(eq(packageLimits.packageId, id)),
    ]);

    return apiResponse(
      { ...packageRow, modules: moduleRows, limits: limitRows },
      'Package retrieved successfully',
    );
  }

  async update(id: string, dto: UpdatePackageDto) {
    let result: Record<string, unknown>;
    try {
      result = await this.db.transaction(async (tx) => {
        const { modules, limits, ...packageChanges } = dto;
        let updatedPackage: typeof packages.$inferSelect | undefined;
        if (Object.keys(packageChanges).length > 0) {
          [updatedPackage] = await tx
            .update(packages)
            .set(packageChanges)
            .where(eq(packages.id, id))
            .returning();
        } else {
          [updatedPackage] = await tx
            .select()
            .from(packages)
            .where(eq(packages.id, id));
        }

        if (!updatedPackage) throw new NotFoundException('Package not found');

        let updatedModules;
        if (modules !== undefined) {
          await tx.delete(packageModules).where(eq(packageModules.packageId, id));
          updatedModules = modules.length
            ? await tx
                .insert(packageModules)
                .values(
                  modules.map((module) => ({
                    packageId: id,
                    moduleKey: module.moduleKey,
                    isEnabled: module.isEnabled,
                  })),
                )
                .returning()
            : [];
        }

        let updatedLimits;
        if (limits !== undefined) {
          await tx.delete(packageLimits).where(eq(packageLimits.packageId, id));
          updatedLimits = limits.length
            ? await tx
                .insert(packageLimits)
                .values(
                  limits.map((limit) => ({
                    packageId: id,
                    limitKey: limit.limitKey,
                    limitValue: limit.limitValue,
                  })),
                )
                .returning()
            : [];
        }

        return {
          ...updatedPackage,
          ...(updatedModules !== undefined && { modules: updatedModules }),
          ...(updatedLimits !== undefined && { limits: updatedLimits }),
        };
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException('A package with this slug already exists');
      }
      throw error;
    }

    return apiResponse(result, 'Package updated successfully');
  }
}
