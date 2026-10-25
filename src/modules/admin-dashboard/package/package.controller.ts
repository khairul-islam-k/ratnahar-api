import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
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
  @ApiOperation({ summary: 'Get all packages with their modules and limits' })
  @ApiOkResponse({ description: 'Packages retrieved successfully' })
  findAll() {
    return this.packageService.findAll();
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
