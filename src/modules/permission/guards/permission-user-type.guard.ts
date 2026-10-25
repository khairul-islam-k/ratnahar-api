import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRED_USER_TYPES_KEY,
  type RequiredUserType,
} from '../decorators/required-user-decorator';

@Injectable()
export class PermissionUserTypeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedUserTypes = this.reflector.getAllAndOverride<RequiredUserType[]>(
      REQUIRED_USER_TYPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Routes without @RequireUserType(...) are allowed through this guard.
    if (!allowedUserTypes?.length) return true;

    const user = context.switchToHttp().getRequest().user;
    
    if (!user || !allowedUserTypes.includes(user.type)) {
      throw new ForbiddenException('Your user type cannot access this resource');
    }

    return true;
  }
}
