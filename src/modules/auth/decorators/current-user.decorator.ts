// src/auth/decorators/current-user.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser, RefreshAuthUser } from '../types/auth-user.type';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: AuthUser | RefreshAuthUser }>();

    return request.user;
  },
);
