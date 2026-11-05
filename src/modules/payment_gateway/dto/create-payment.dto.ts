import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUrl, IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    format: 'uuid',
    example: 'b3f6c15e-6542-4fd1-bb0d-b37f0e2f9e13',
  })
  @IsUUID()
  packageId!: string;

  @ApiProperty({
    format: 'uuid',
    example: '5e14e455-3a2a-4d08-b3b0-e64eed69dc87',
  })
  @IsUUID()
  paymentGatewayId!: string;

  @ApiProperty({ enum: ['monthly', 'yearly'], example: 'monthly' })
  @IsIn(['monthly', 'yearly'])
  billingCycle!: 'monthly' | 'yearly';

  @ApiProperty({
    format: 'url',
    example: 'https://example.com/payment/callback',
  })
  @IsUrl({ require_protocol: true })
  callbackURL!: string;
}
