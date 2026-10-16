import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { GalleryStatus } from 'src/database/schema/gallery';

export class CreateGalleryDto {
  @ApiProperty({ example: 'Office Photo', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Front view of the office', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string;

  @ApiPropertyOptional({ enum: GalleryStatus, default: GalleryStatus.ACTIVE })
  @IsOptional()
  @IsEnum(GalleryStatus)
  status?: GalleryStatus;

  // Swagger-only field: renders a file picker. The file itself is handled by
  // Multer, not by the validated body.
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Image file (JPG, PNG, WEBP, GIF, max 5 MB)',
  })
  image?: any;
}