import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, Req, UploadedFile, BadRequestException } from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { ApiBadRequestResponse, ApiConsumes, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { galleryMulterOptions } from './config/multer.config';
import { FileInterceptor } from '@nestjs/platform-express';

function resolveTenantId(user: any): string | undefined {
  if (user?.type === 'TENANT') return user.id;
  if (user?.type === 'EMPLOYEE') return user.tenantId;
  return undefined;
}

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @ApiTags('Gallery')
  @Post()
  @ApiOperation({ summary: 'Create a gallery item (image optional)' })
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ description: 'Gallery item created' })
  @ApiBadRequestResponse({ description: 'Validation failed or invalid file' })
  @UseInterceptors(FileInterceptor('image', galleryMulterOptions))
  create(
    @Body() dto: CreateGalleryDto,
    @Req() req: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const tenantId = resolveTenantId(req.user) ?? dto.tenantId;
    if (!tenantId) throw new BadRequestException('tenantId is required');
    return this.galleryService.create(dto, tenantId, file);
  }

  @Get()
  findAll() {
    return this.galleryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.galleryService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGalleryDto: UpdateGalleryDto) {
    return this.galleryService.update(+id, updateGalleryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.galleryService.remove(+id);
  }
}
