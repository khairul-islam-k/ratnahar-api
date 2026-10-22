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
  ParseArrayPipe,
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
  @ApiOperation({ summary: 'Assign permissions to roles in bulk' })
  @ApiBody({ type: [AssignPermissionDto] })
  @ApiCreatedResponse({
    description: 'Permissions assigned to roles successfully',
    schema: {
      example: {
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            roleId: '550e8400-e29b-41d4-a716-446655440000',
            permissionId: '550e8400-e29b-41d4-a716-446655440001',
          },
        ],
        message: 'Permissions assigned to roles successfully',
      },
    },
  })
  assignPermissions(
    @Body(new ParseArrayPipe({ items: AssignPermissionDto }))
    assignments: AssignPermissionDto[],
  ) {
    if (!assignments.length) {
      throw new BadRequestException('At least one assignment is required');
    }
    return this.roleService.assignPermissions(assignments);
  }

  @Post('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiBody({ type: AssignUserRoleDto })
  @ApiCreatedResponse({
    description: 'Role assigned to user successfully',
    schema: {
      example: {
        data: {
          id: '550e8400-e29b-41d4-a716-446655440002',
          userId: '550e8400-e29b-41d4-a716-446655440000',
          roleId: '550e8400-e29b-41d4-a716-446655440001',
        },
        message: 'Role assigned to user successfully',
      },
    },
  })
  assignRoleToUser(
    @Body() dto: AssignUserRoleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.roleService.assignRoleToUser(dto, user.id);
  }
}
