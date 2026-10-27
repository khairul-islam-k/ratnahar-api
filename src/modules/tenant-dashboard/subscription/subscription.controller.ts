import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/auth/types/auth-user.type';

@ApiTags('Subscription (tenant-dashboard)')
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Purchase a package subscription for the authenticated tenant' })
  @ApiBody({ type: CreateSubscriptionDto })
  @ApiCreatedResponse({ description: 'Subscription purchased successfully' })
  @ApiBadRequestResponse({ description: 'Package is inactive or has no price for the selected billing cycle' })
  @ApiNotFoundResponse({ description: 'Package not found' })
  create(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @CurrentUser() user: AuthUser,
  ) {
    if (!user.tenantId) throw new BadRequestException('tenantId is required');
    return this.subscriptionService.create(createSubscriptionDto, user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all available packages with their modules' })
  @ApiOkResponse({ description: 'Packages retrieved successfully' })
  findAll() {
    return this.subscriptionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSubscriptionDto: UpdateSubscriptionDto) {
    return this.subscriptionService.update(+id, updateSubscriptionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionService.remove(+id);
  }
}
