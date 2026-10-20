import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { PermissionGuard } from './guards/permission.guard';

@Module({
  controllers: [PermissionController],
  providers: [PermissionService, PermissionGuard],
  exports: [PermissionGuard, PermissionService],
})
export class PermissionModule {}
