import { Inject, Injectable } from '@nestjs/common';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import type { Database } from 'src/database/database.types';
import { gallery } from 'src/database/schema/gallery';
import { basename, join } from 'path';
import { GALLERY_UPLOAD_DIR } from './config/multer.config';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { desc, eq } from 'drizzle-orm';

@Injectable()
export class GalleryService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}
  
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

  private async removeFile(imageUrl: string) {
    // basename() prevents path traversal
    const fullPath = join(GALLERY_UPLOAD_DIR, basename(imageUrl));
    if (existsSync(fullPath)) {
      await unlink(fullPath).catch(() => undefined);
    }
  }


  findAll(tenantId?: string) {
    return this.db
      .select()
      .from(gallery)
      .where(tenantId ? eq(gallery.tenantId, tenantId) : undefined)
      .orderBy(desc(gallery.createdAt));
  }


  findOne(id: number) {
    return `This action returns a #${id} gallery`;
  }

  update(id: number, updateGalleryDto: UpdateGalleryDto) {
    return `This action updates a #${id} gallery`;
  }

  remove(id: number) {
    return `This action removes a #${id} gallery`;
  }
}
