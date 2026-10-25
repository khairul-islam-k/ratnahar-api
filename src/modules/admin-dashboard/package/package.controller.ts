import {
  Body,
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { PackageService } from './package.service';
import { RequireUserType } from 'src/modules/permission/decorators/required-user-decorator';
import { SystemUserType } from 'src/database/schema/system';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { PermissionUserTypeGuard } from 'src/modules/permission/guards/permission-user-type.guard';

@ApiTags('Packages (admin-dashboard)')
@Controller('packages')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionUserTypeGuard)
  @ApiBearerAuth('access-token')
  @RequireUserType(SystemUserType.ADMIN)
  @ApiOperation({ summary: 'Create a package with its modules and limits' })
  @ApiCreatedResponse({ description: 'Package created successfully' })
  create(@Body() dto: CreatePackageDto) {
    return this.packageService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionUserTypeGuard)
  @ApiBearerAuth('access-token')
  @RequireUserType(SystemUserType.ADMIN)
  @ApiOperation({ summary: 'Get all packages with their modules and limits'})
  @ApiOkResponse({ description: 'Packages retrieved successfully'})
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search package name, slug, or description' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'] })
  @ApiQuery({ name: 'pricingType', required: false, enum: ['fixed', 'custom'] })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('pricingType') pricingType?: string,
  ) {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('page and limit must be greater than 0');
    }
    if (status && !['active', 'inactive'].includes(status)) {
      throw new BadRequestException('status must be active or inactive');
    }
    if (pricingType && !['fixed', 'custom'].includes(pricingType)) {
      throw new BadRequestException('pricingType must be fixed or custom');
    }
    return this.packageService.findAll(
      page,
      Math.min(limit, 100),
      search?.trim() || undefined,
      status as 'active' | 'inactive' | undefined,
      pricingType as 'fixed' | 'custom' | undefined,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionUserTypeGuard)
  @ApiBearerAuth('access-token')
  @RequireUserType(SystemUserType.ADMIN)
  @ApiOperation({ summary: 'Get one package with its modules and limits' })
  @ApiParam({ name: 'id', description: 'Package UUID' })
  @ApiOkResponse({ description: 'Package retrieved successfully' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.packageService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionUserTypeGuard)
  @ApiBearerAuth('access-token')
  @RequireUserType(SystemUserType.ADMIN)
  @ApiOperation({ summary: 'Update a package and optionally replace its modules and limits' })
  @ApiParam({ name: 'id', description: 'Package UUID' })
  @ApiOkResponse({ description: 'Package updated successfully' })
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdatePackageDto) {
    return this.packageService.update(id, dto);
  }
}
