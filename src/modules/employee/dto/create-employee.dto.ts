import {
  IsEmail,
  IsDateString,
  IsOptional,
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

  @ApiPropertyOptional({ example: '+8801700000000', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg', maxLength: 2048 })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  photo?: string;

  @ApiPropertyOptional({ example: 'Female', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  gender?: string;

  @ApiPropertyOptional({ example: '1995-04-12', format: 'date' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: '12 Main Street' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Dhaka', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Dhaka', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ example: '1207', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  postalCode?: string;

  @ApiPropertyOptional({ example: 'Bangladesh', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ example: '+8801800000000', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergencyContact?: string;

  @ApiPropertyOptional({ example: 'Employee notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
