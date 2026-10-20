import { Module } from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { GalleryController } from './gallery.controller';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [PermissionModule],
  controllers: [GalleryController],
  providers: [GalleryService],
})
export class GalleryModule {}
