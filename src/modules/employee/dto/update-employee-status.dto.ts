import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SystemUserStatus } from 'src/database/schema/system';

export class UpdateEmployeeStatusDto {
  @ApiProperty({ enum: Object.values(SystemUserStatus), example: SystemUserStatus.ACTIVE })
  @IsEnum(SystemUserStatus)
  status!: SystemUserStatus;
}
