import { BadRequestException, Body, Controller, DefaultValuePipe, Delete, Get, Param, ParseArrayPipe, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PaymentGatewayService } from './payment_gateway.service';
import { CreatePaymentGatewayDto } from './dto/create-payment_gateway.dto';
import { UpdatePaymentGatewayDto } from './dto/update-payment_gateway.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';

@Controller('payment-gateway')
@ApiTags('Payment Gateways')
export class PaymentGatewayController {
  constructor(private readonly paymentGatewayService: PaymentGatewayService) {}

  @Post()
  @ApiOperation({ summary: 'Create or update one tenant payment gateway config' })
  @ApiCreatedResponse({ description: 'Payment gateway config saved successfully' })
  @ApiBadRequestResponse({ description: 'Invalid config or payment gateway was not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiBody({ type: CreatePaymentGatewayDto })
  createSingleConfig(
    @CurrentUser() user: AuthUser,
    @Body() createPaymentGatewayDto: CreatePaymentGatewayDto
  ) {
    if (!user.tenantId) throw new BadRequestException('tenantId is required');
    return this.paymentGatewayService.createSingleConfig(createPaymentGatewayDto, user.tenantId);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Create or update multiple tenant payment gateway configs' })
  @ApiCreatedResponse({ description: 'Payment gateway configs saved successfully' })
  @ApiBadRequestResponse({ description: 'Invalid config list or payment gateway was not found' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiBody({ type: [CreatePaymentGatewayDto] })
  createMultipleConfig(
    @CurrentUser() user: AuthUser,
    @Body(new ParseArrayPipe({ items: CreatePaymentGatewayDto }))
    createPaymentGatewayDtos: CreatePaymentGatewayDto[],
  ) {
    if (!user.tenantId) throw new BadRequestException('tenantId is required');
    return this.paymentGatewayService.createMultipleConfig(createPaymentGatewayDtos, user.tenantId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get paginated payment gateway configs for the current tenant' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiOkResponse({ description: 'Tenant payment gateway configs returned successfully' })
  @ApiBadRequestResponse({ description: 'Invalid page or limit' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (!user.tenantId) throw new BadRequestException('tenantId is required');
    if (page < 1 || limit < 1) {
      throw new BadRequestException('page and limit must be greater than 0');
    }
    return this.paymentGatewayService.findAll(user.tenantId, page, Math.min(limit, 100));
  }

}
