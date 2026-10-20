import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';
import { join } from 'path';

export const UPLOAD_ROOT = join(process.cwd(), 'uploads');
export const GALLERY_UPLOAD_DIR = join(UPLOAD_ROOT, 'gallery');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const galleryMulterOptions: MulterOptions = {
  // Keep uploads in memory so Sharp can resize/convert them before storage.
  storage: memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        new BadRequestException('Only JPG, PNG and WEBP images are allowed'),
        false,
      );
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
};
