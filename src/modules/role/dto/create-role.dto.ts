import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateRoleDto {
  @ApiPropertyOptional({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Tenant UUID. Omit or pass null for a system-wide role.',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string | null;

  @ApiProperty({ example: 'Gallery Manager', maxLength: 150 })
  @IsString()
  @Length(1, 150)
  name!: string;

  @ApiProperty({ example: 'gallery-manager', maxLength: 150 })
  @IsString()
  @Length(1, 150)
  slug!: string;

  @ApiPropertyOptional({ example: 'Can manage gallery content' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSystemRole?: boolean;
}
