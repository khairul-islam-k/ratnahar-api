import {
  Body,
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleService } from './role.service';
import { AssignPermissionDto } from './dto/assign-permissions.dto';
import { AssignUserRoleDto } from './dto/assign-user-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';

@ApiTags('Role')
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all roles for a tenant' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'manager' })
  findAllByTenant(
    @CurrentUser() user: AuthUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    if (!user.tenantId) throw new BadRequestException('tenantId is required');
    if (page < 1 || limit < 1) {
      throw new BadRequestException('page and limit must be greater than 0');
    }
    return this.roleService.findAllByTenant(
      user.tenantId,
      page,
      Math.min(limit, 100),
      search?.trim(),
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get one role in the current tenant' })
  @ApiParam({ name: 'id', format: 'uuid' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    if (!user.tenantId) throw new BadRequestException('tenantId is required');
    return this.roleService.findOneByTenant(id, user.tenantId);
  }

  @Get(':id/permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get permissions assigned to a role' })
  @ApiParam({ name: 'id', format: 'uuid' })
  getPermissionsByRoleId(
    @Param('id', ParseUUIDPipe) roleId: string,
  ) {
    return this.roleService.getPermissionsByRoleId(roleId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a role in the current tenant' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: AuthUser,
  ) {
    if (!user.tenantId) throw new BadRequestException('tenantId is required');
    return this.roleService.update(id, dto, user.tenantId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a role in the current tenant' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    if (!user.tenantId) throw new BadRequestException('tenantId is required');
    return this.roleService.remove(id, user.tenantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a role' })
  create(
    @Body() dto: CreateRoleDto,
    @CurrentUser() user: AuthUser,
  ) {
    if (!user.tenantId) throw new BadRequestException('tenantId is required');
    return this.roleService.create(dto, user.tenantId);
  }

  @Post('permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Assign permissions to roles in bulk' })
  @ApiBody({ type: AssignPermissionDto })
  assignPermissions(
    @Body() dto: AssignPermissionDto,
  ) {
    if (!dto.data?.length) {
      throw new BadRequestException('At least one assignment is required');
    }
    return this.roleService.assignPermissions(dto);
  }

  @Post('users/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiBody({ type: AssignUserRoleDto })
  assignRoleToUser(
    @Body() dto: AssignUserRoleDto,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.roleService.assignRoleToUser(dto, userId);
  }
}
