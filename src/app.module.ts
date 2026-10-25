import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { PermissionModule } from './modules/permission/permission.module';
import { RoleModule } from './modules/role/role.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { SubscriptionModule } from './modules/admin-dashboard/subscription/subscription.module';
import { PackageModule } from './modules/admin-dashboard/package/package.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    GalleryModule,
    PermissionModule,
    RoleModule,
    EmployeeModule,
    SubscriptionModule,
    PackageModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
