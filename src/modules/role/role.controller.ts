import {
  Body,
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
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
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleService } from './role.service';
import { AssignPermissionDto } from './dto/assign-permissions.dto';
import { AssignUserRoleDto } from './dto/assign-user-role.dto';
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

  @Post()
  @ApiOperation({ summary: 'Create a role' })
  @ApiCreatedResponse({
    description: 'Role created successfully',
    schema: {
      example: {
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          tenantId: null,
          name: 'Gallery Manager',
          slug: 'gallery-manager',
          description: 'Can manage gallery content',
          isSystemRole: false,
          createdAt: '2026-10-18T12:00:00.000Z',
          updatedAt: '2026-10-18T12:00:00.000Z',
        },
        message: 'Role created successfully',
      },
    },
  })
  create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
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
