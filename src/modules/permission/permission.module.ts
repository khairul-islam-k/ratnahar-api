import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { PermissionGuard } from './guards/permission.guard';
import { PermissionUserTypeGuard } from './guards/permission-user-type.guard';

@Module({
  controllers: [PermissionController],
  providers: [PermissionService, PermissionGuard, PermissionUserTypeGuard],
  exports: [PermissionGuard, PermissionUserTypeGuard, PermissionService],
})
export class PermissionModule {}
