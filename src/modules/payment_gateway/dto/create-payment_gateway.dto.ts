import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class PaymentGatewayCredentialsDto {
  @ApiProperty({ example: 'merchant-user' })
  @IsString()
  username!: string;

  @ApiProperty({ example: 'your-password' })
  @IsString()
  password!: string;

  @ApiProperty({ example: 'your-app-key' })
  @IsString()
  appKey!: string;

  @ApiProperty({ example: 'your-app-secret' })
  @IsString()
  appSecret!: string;
}

export class CreatePaymentGatewayDto {

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  paymentGatewayId!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isLive?: boolean;

  @ApiPropertyOptional({ enum: ['active', 'inactive'], default: 'active' })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @ApiProperty({ type: PaymentGatewayCredentialsDto })
  @ValidateNested()
  @Type(() => PaymentGatewayCredentialsDto)
  gatewayData!: PaymentGatewayCredentialsDto;
}
