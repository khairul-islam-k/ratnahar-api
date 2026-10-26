import { ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateTenantDto } from './create-tenant.dto';
import { SystemUserStatus } from 'src/database/schema/system';

class UpdatableTenantFieldsDto extends PickType(CreateTenantDto, [
  'name',
  'email',
  'phone',
  'businessName',
  'photo',
] as const) {}

export class UpdateTenantDto extends PartialType(UpdatableTenantFieldsDto) {
  @ApiPropertyOptional({ enum: Object.values(SystemUserStatus) })
  @IsOptional()
  @IsEnum(SystemUserStatus)
  status?: SystemUserStatus;
}
