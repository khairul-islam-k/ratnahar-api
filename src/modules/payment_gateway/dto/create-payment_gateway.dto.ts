import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsUUID,
} from 'class-validator';

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

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    examples: [
      {
        username: 'merchant-user',
        password: 'your-password',
        appKey: 'your-app-key',
        appSecret: 'your-app-secret',
      },
      {
        storeId: 'merchant-user',
        storePasswd: 'your-password'
      },
    ],
  })
  @IsObject()
  @IsNotEmpty()
  gatewayData!: Object;
}
