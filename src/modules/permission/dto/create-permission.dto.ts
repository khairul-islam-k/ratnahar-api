import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  permissionActionEnum,
  permissionFeatureEnum,
} from 'src/database/schema/rbc-permission';

export class CreatePermissionDto {
  @ApiProperty({ enum: permissionFeatureEnum.enumValues, example: 'Gallery' })
  @IsIn(permissionFeatureEnum.enumValues)
  featureKey!: (typeof permissionFeatureEnum.enumValues)[number];

  @ApiProperty({
    enum: permissionActionEnum.enumValues,
    example: 'read',
  })
  @IsIn(permissionActionEnum.enumValues)
  actionKey!: (typeof permissionActionEnum.enumValues)[number];

  @ApiPropertyOptional({ example: 'View gallery images', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
