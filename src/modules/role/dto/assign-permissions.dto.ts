import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class AssignPermissionItemDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID('4')
  permissionId!: string;
}

export class AssignPermissionDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  roleId!: string;

  @ApiProperty({ type: [AssignPermissionItemDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AssignPermissionItemDto)
  data!: AssignPermissionItemDto[];
}
