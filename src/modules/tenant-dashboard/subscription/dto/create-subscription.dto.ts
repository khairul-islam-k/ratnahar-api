import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({ format: 'uuid', example: 'b3f6c15e-6542-4fd1-bb0d-b37f0e2f9e13' })
  @IsUUID()
  packageId!: string;

  @ApiProperty({ enum: ['monthly', 'yearly'], example: 'monthly' })
  @IsIn(['monthly', 'yearly'])
  billingCycle!: 'monthly' | 'yearly';

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}
