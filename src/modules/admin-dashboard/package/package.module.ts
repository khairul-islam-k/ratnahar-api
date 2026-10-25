import { Module } from '@nestjs/common';
import { PackageController } from './package.controller';
import { PackageService } from './package.service';
import { PermissionModule } from 'src/modules/permission/permission.module';

@Module({
  imports: [PermissionModule],
  controllers: [PackageController],
  providers: [PackageService],
})
export class PackageModule {}
