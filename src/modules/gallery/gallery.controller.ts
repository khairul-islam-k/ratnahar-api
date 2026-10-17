import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  ParseIntPipe,
  ParseUUIDPipe,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { galleryMulterOptions } from './config/multer.config';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';

@ApiTags('Gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) { }

  @Post('bulk')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create multiple gallery items from uploaded images' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 20, galleryMulterOptions))
  createMany(
    @CurrentUser() user: AuthUser,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!user.tenantId) throw new BadRequestException('tenantId is required');
    if (!files?.length) {
      throw new BadRequestException('At least one image is required');
    }
    return this.galleryService.createMany(user.tenantId, files);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a gallery item (image optional)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', galleryMulterOptions))
  create(
    @Body() dto: CreateGalleryDto,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const tenantId = user.tenantId ? user.tenantId : '';
    if (!tenantId) throw new BadRequestException('tenantId is required');
    return this.galleryService.create(dto, tenantId, file);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get paginated gallery items for the current tenant' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (!user.tenantId) throw new BadRequestException('tenantId is required');
    if (page < 1 || limit < 1) {
      throw new BadRequestException('page and limit must be greater than 0');
    }
    return this.galleryService.findAll(user.tenantId, page, Math.min(limit, 100));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get one gallery item' })
  @ApiParam({ name: 'id', format: 'uuid' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    if (!user.tenantId) throw new BadRequestException('tenantId is required');
    return this.galleryService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a gallery item (send image to replace it)' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', format: 'uuid' })
  @UseInterceptors(FileInterceptor('image', galleryMulterOptions))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGalleryDto,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!user.tenantId) throw new BadRequestException('tenantId is required');
    return this.galleryService.update(id, dto, user.tenantId, file);
  }

  @Delete('bulk')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete multiple gallery items and their image files' })
  @ApiBody({ schema: { type: 'object', required: ['ids'], properties: { ids: { type: 'array', items: { type: 'string', format: 'uuid' }, minItems: 1, maxItems: 100 } } } })
  removeMany(
    @Body('ids') ids: string[],
    @CurrentUser() user: AuthUser,
  ) {
    if (!user.tenantId) throw new BadRequestException('tenantId is required');
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100) {
      throw new BadRequestException('ids must be an array containing 1 to 100 UUIDs');
    }
    if (ids.some((id) => typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
      throw new BadRequestException('ids must contain valid UUIDs');
    }
    return this.galleryService.removeMany([...new Set(ids)], user.tenantId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a gallery item and its image file' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    if (!user.tenantId) throw new BadRequestException('tenantId is required');
    return this.galleryService.remove(id, user.tenantId);
  }

}
