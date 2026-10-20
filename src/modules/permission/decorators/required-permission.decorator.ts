import { SetMetadata } from '@nestjs/common';
import {
  permissionActionEnum,
  permissionFeatureEnum,
} from 'src/database/schema/rbc-permission';

export const REQUIRED_PERMISSION_KEY = 'required_permission';

export type RequiredPermission = {
  featureKey: (typeof permissionFeatureEnum.enumValues)[number];
  actionKey: (typeof permissionActionEnum.enumValues)[number];
};

export const RequirePermission = (
  featureKey: RequiredPermission['featureKey'],
  actionKey: RequiredPermission['actionKey'],
) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, {
    featureKey,
    actionKey,
  } satisfies RequiredPermission);
