import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import type { Database } from 'src/database/database.types';
import { gallery } from 'src/database/schema/gallery';
import { basename, extname, join } from 'path';
import { GALLERY_UPLOAD_DIR } from './config/multer.config';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { apiResponse, paginatedResponse } from 'src/common/interceptors/response.interceptor';

@Injectable()
export class GalleryService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) { }

  async create(
    dto: CreateGalleryDto,
    tenantId: string,
    file?: Express.Multer.File,
  ) {
    try {
      const [row] = await this.db
        .insert(gallery)
        .values({
          tenantId,
          title: dto.title,
          altText: dto.altText,
          status: dto.status,
          imageUrl: file ? `/uploads/gallery/${file.filename}` : null,
        })
        .returning();
      return row;
    } catch (error) {
      if (file) await this.removeFile(`/uploads/gallery/${file.filename}`);
      throw error;
    }
  }

  async createMany(tenantId: string, files: Express.Multer.File[]) {
    try {
      return await this.db
        .insert(gallery)
        .values(
          files.map((file) => ({
            tenantId,
            title:
              basename(file.originalname, extname(file.originalname)).slice(
                0,
                200,
              ) || 'Gallery image',
            altText: basename(file.originalname, extname(file.originalname)).slice(
              0,
              200,
            ) || 'Gallery image',
            imageUrl: `/uploads/gallery/${file.filename}`,
          })),
        )
        .returning();
    } catch (error) {
      await Promise.all(
        files.map((file) =>
          this.removeFile(`/uploads/gallery/${file.filename}`),
        ),
      );
      throw error;
    }
  }


  async findAll(tenantId: string, page: number, limit: number) {
    const where = eq(gallery.tenantId, tenantId);
    const offset = (page - 1) * limit;

    const [rows, [totalResult]] = await Promise.all([
      this.db
        .select()
        .from(gallery)
        .where(where)
        .orderBy(desc(gallery.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(gallery).where(where),
    ]);

    const total = totalResult.total;
    return paginatedResponse(
      rows,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      'Gallery items retrieved successfully',
    );
  }


  async findOne(id: string, tenantId?: string) {
    const [row] = await this.db
      .select()
      .from(gallery)
      .where(
        and(
          eq(gallery.id, id),
          tenantId ? eq(gallery.tenantId, tenantId) : undefined,
        ),
      )
      .limit(1);

    if (!row) throw new NotFoundException('Gallery item not found');
    return apiResponse(row, 'Gallery item retrieved successfully');
  }

  async update(
    id: string,
    dto: UpdateGalleryDto,
    tenantId?: string,
    file?: Express.Multer.File,
  ) {
    let existing;
    try {
      existing = await this.findOne(id, tenantId);
    } catch (error) {
      if (file) await this.removeFile(`/uploads/gallery/${file.filename}`);
      throw error;
    }

    const [row] = await this.db
      .update(gallery)
      .set({
        title: dto.title,
        altText: dto.altText,
        status: dto.status,
        ...(file ? { imageUrl: `/uploads/gallery/${file.filename}` } : {}),
      })
      .where(eq(gallery.id, id))
      .returning();

    // Remove the old image after the new one is saved
    if (file && existing.imageUrl) await this.removeFile(existing.imageUrl);

    return row;
  }

  async remove(id: string, tenantId?: string) {
    const existing = await this.findOne(id, tenantId);
    await this.db.delete(gallery).where(eq(gallery.id, id));
    if (existing.data.imageUrl) {
      await this.removeFile(existing.data.imageUrl);
    }
    return { message: 'Gallery item deleted' };
  }

  async removeMany(ids: string[], tenantId: string) {
    const rows = await this.db
      .select({ id: gallery.id, imageUrl: gallery.imageUrl })
      .from(gallery)
      .where(and(inArray(gallery.id, ids), eq(gallery.tenantId, tenantId)));

    if (rows.length) {
      await this.db
        .delete(gallery)
        .where(
          and(
            inArray(gallery.id, rows.map((row) => row.id)),
            eq(gallery.tenantId, tenantId),
          ),
        );

      await Promise.all(
        rows
          .filter((row) => row.imageUrl)
          .map((row) => this.removeFile(row.imageUrl!)),
      );
    }

    return {
      message: 'Gallery items deleted',
      deletedIds: rows.map((row) => row.id),
      notFoundIds: ids.filter((id) => !rows.some((row) => row.id === id)),
    };
  }

  private async removeFile(imageUrl: string) {
    // basename() prevents path traversal
    const fullPath = join(GALLERY_UPLOAD_DIR, basename(imageUrl));
    if (existsSync(fullPath)) {
      await unlink(fullPath).catch(() => undefined);
    }
  }
}
