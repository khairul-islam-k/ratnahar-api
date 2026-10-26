import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'John', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'john@example.com', maxLength: 150 })
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @ApiProperty({
    example: '+8801700000000',
    description: 'Valid Bangladesh phone number in local or international format',
  })
  @IsPhoneNumber('BD')
  phone!: string;

  @ApiProperty({ example: 'Password@123', minLength: 8, writeOnly: true })
  @IsStrongPassword({
    minLength: 8,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
    minLowercase: 1,
  })
  password!: string;

  @ApiPropertyOptional({ example: 'My Business', default: 'My Business' })
  @IsString()
  @MaxLength(150)
  businessName: string = 'My Business';

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg', maxLength: 2048 })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  photo?: string;
}
