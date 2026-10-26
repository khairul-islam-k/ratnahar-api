import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SystemUserStatus, SystemUserType } from 'src/database/schema/system';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { PermissionUserTypeGuard } from 'src/modules/permission/guards/permission-user-type.guard';
import { RequireUserType } from 'src/modules/permission/decorators/required-user-decorator';

@ApiTags('Tenant (Admin dashboar)')
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) { }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionUserTypeGuard)
  @ApiBearerAuth('access-token')
  @RequireUserType(SystemUserType.ADMIN)
  @ApiOperation({ summary: 'Create a tenant and its business shop' })
  @ApiBody({ type: CreateTenantDto })
  @ApiCreatedResponse({ description: 'Tenant and business shop created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid tenant details, email, phone, or password' })
  @ApiConflictResponse({ description: 'Email or phone number is already in use; conflicting fields are included in errors' })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantService.create(createTenantDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionUserTypeGuard)
  @ApiBearerAuth('access-token')
  @RequireUserType(SystemUserType.ADMIN)
  @ApiOperation({ summary: 'Get paginated tenants' })
  @ApiOkResponse({ description: 'Tenant list with pagination metadata' })
  @ApiBadRequestResponse({ description: 'Invalid page, limit, or status filter' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search tenant name, email, or phone' })
  @ApiQuery({ name: 'status', required: false, enum: Object.values(SystemUserStatus) })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('page and limit must be greater than 0');
    }
    if (status && !Object.values(SystemUserStatus).includes(status as typeof SystemUserStatus[keyof typeof SystemUserStatus])) {
      throw new BadRequestException(`status must be one of: ${Object.values(SystemUserStatus).join(', ')}`);
    }
    return this.tenantService.findAll({
      page,
      limit: Math.min(limit, 100),
      search: search?.trim() || undefined,
      status: status as typeof SystemUserStatus[keyof typeof SystemUserStatus] | undefined,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionUserTypeGuard)
  @ApiBearerAuth('access-token')
  @RequireUserType(SystemUserType.ADMIN)
  @ApiOperation({ summary: 'Get a tenant by ID, including its business name' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Tenant UUID' })
  @ApiOkResponse({ description: 'Tenant details and business name; password hashes are excluded' })
  @ApiBadRequestResponse({ description: 'Tenant ID is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'Tenant not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionUserTypeGuard)
  @ApiBearerAuth('access-token')
  @RequireUserType(SystemUserType.ADMIN)
  @ApiOperation({ summary: 'Update a tenant and its business shop' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Tenant UUID' })
  @ApiBody({ type: UpdateTenantDto })
  @ApiOkResponse({ description: 'Tenant updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid tenant ID, update fields, or status' })
  @ApiConflictResponse({ description: 'Email or phone number is already in use; conflicting fields are included in errors' })
  @ApiNotFoundResponse({ description: 'Tenant not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return this.tenantService.update(id, updateTenantDto);
  }
}
