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
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateEmployeeStatusDto } from './dto/update-employee-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SystemUserStatus } from 'src/database/schema/system';

@ApiTags('Employee')
@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create an employee for the authenticated tenant' })
  create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @CurrentUser() user: AuthUser,
  ) {
    if (!user.tenantId) throw new BadRequestException('tenantId is required');
    return this.employeeService.create(
      createEmployeeDto,
      user.tenantId,
      user.id,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get paginated employees for the authenticated tenant' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Items per page (default: 10, maximum: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search employee name, email, or phone' })
  @ApiQuery({ name: 'status', required: false, enum: Object.values(SystemUserStatus), description: 'Filter by employee status' })
  
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    if (!user.tenantId) throw new BadRequestException('tenantId is required');
    if (page < 1 || limit < 1) throw new BadRequestException('page and limit must be greater than 0');
    return this.employeeService.findAll(user.tenantId, {
      page,
      limit: Math.min(limit, 100),
      search,
      status,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get an employee by ID within the authenticated tenant' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Employee UUID' })
  @ApiOkResponse({ description: 'Employee details' })
  @ApiNotFoundResponse({ description: 'Employee not found in this tenant' })
  @ApiBadRequestResponse({ description: 'Invalid employee UUID or missing tenant' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    if (!user.tenantId) throw new BadRequestException('tenantId is required');
    return this.employeeService.findOne(id, user.tenantId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update an employee status for the authenticated tenant' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Employee UUID' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    if (!user.tenantId) throw new BadRequestException('tenantId is required');
    return this.employeeService.updateStatus(id, dto, user.tenantId, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateEmployeeDto: UpdateEmployeeDto, @CurrentUser() user: AuthUser) {
    if (!user.tenantId) throw new BadRequestException('tenantId is required');
    return this.employeeService.update(id, updateEmployeeDto, user.tenantId, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    if (!user.tenantId) throw new BadRequestException('tenantId is required');
    return this.employeeService.remove(id, user.tenantId, user.id);
  }
}
