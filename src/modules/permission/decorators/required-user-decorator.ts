import { SetMetadata } from '@nestjs/common';
import { SystemUserType } from 'src/database/schema/system';

export const REQUIRED_USER_TYPES_KEY = 'required_user_types';

export type RequiredUserType = SystemUserType;

export const RequireUserType = (...userTypes: RequiredUserType[]) =>
  SetMetadata(REQUIRED_USER_TYPES_KEY, userTypes);
