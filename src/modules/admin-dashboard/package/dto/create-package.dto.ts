import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  packagePricingTypeEnum,
  packageStatusEnum,
} from 'src/database/schema/subscription';

export class CreatePackageModuleDto {
  @ApiProperty({ example: 'inventory' })
  @IsString()
  @MaxLength(100)
  moduleKey!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class CreatePackageLimitDto {
  @ApiProperty({ example: 'max_products' })
  @IsString()
  @MaxLength(100)
  limitKey!: string;

  @ApiProperty({ example: 1000 })
  @IsInt()
  @Min(-1)
  limitValue!: number;
}

export class CreatePackageDto {
  @ApiProperty({ example: 'Pro' })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'pro' })
  @IsString()
  @MaxLength(150)
  slug!: string;

  @ApiProperty({ enum: packagePricingTypeEnum.enumValues, example: 'fixed' })
  @IsIn(packagePricingTypeEnum.enumValues)
  pricingType!: (typeof packagePricingTypeEnum.enumValues)[number];

  @ApiPropertyOptional({ example: '49.00' })
  @IsOptional()
  @IsNumberString()
  monthlyPrice?: string;

  @ApiPropertyOptional({ example: '490.00' })
  @IsOptional()
  @IsNumberString()
  yearlyPrice?: string;

  @ApiPropertyOptional({ example: 'For growing businesses' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: packageStatusEnum.enumValues, default: 'active' })
  @IsOptional()
  @IsIn(packageStatusEnum.enumValues)
  status?: (typeof packageStatusEnum.enumValues)[number];

  @ApiPropertyOptional({ type: [CreatePackageModuleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePackageModuleDto)
  modules?: CreatePackageModuleDto[];

  @ApiPropertyOptional({ type: [CreatePackageLimitDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePackageLimitDto)
  limits?: CreatePackageLimitDto[];
}
