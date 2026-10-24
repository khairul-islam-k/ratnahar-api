import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRED_PERMISSION_KEY,
  type RequiredPermission,
} from '../decorators/required-permission.decorator';
import { SystemUserType } from 'src/database/schema/system';
import { PermissionService } from '../permission.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
) {}

   async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<RequiredPermission>(
      REQUIRED_PERMISSION_KEY,
      context.getHandler(),
    );

    // Routes without @RequirePermission(...) are allowed through this guard.
    if (!requiredPermission) return true;

    const { featureKey, actionKey } = requiredPermission;

    const user = context.switchToHttp().getRequest().user;

    if (user.type === SystemUserType.TENANT) {
        return true;
    }

    const permissions = await this.permissionService.getUserPermissions(user.id);
    


    const hasPermission = permissions.data.some(
      (permission) =>
        permission.featureKey === featureKey &&
        permission.actionKey === actionKey,
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    return true;
  }
}
