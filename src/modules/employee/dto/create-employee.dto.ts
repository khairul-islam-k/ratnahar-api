import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Ruhul amin', maxLength: 150 })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'ruhul@gmail.com', maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'Khairul@37', minLength: 8, writeOnly: true })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    example: '+8801700000000',
    maxLength: 30,
    description: 'Valid Bangladesh phone number in local or international format',
  })
  @IsOptional()
  @IsPhoneNumber('BD')
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg', maxLength: 2048 })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  photo?: string;

}
