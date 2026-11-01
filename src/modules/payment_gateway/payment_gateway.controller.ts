import { BadRequestException, Body, Controller, Delete, Get, Param, ParseArrayPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { PaymentGatewayService } from './payment_gateway.service';
import { CreatePaymentGatewayDto } from './dto/create-payment_gateway.dto';
import { UpdatePaymentGatewayDto } from './dto/update-payment_gateway.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';

@Controller('payment-gateway')
export class PaymentGatewayController {
  constructor(private readonly paymentGatewayService: PaymentGatewayService) {}

  @Post()
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
  findAll() {
    return this.paymentGatewayService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentGatewayService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaymentGatewayDto: UpdatePaymentGatewayDto) {
    return this.paymentGatewayService.update(+id, updatePaymentGatewayDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentGatewayService.remove(+id);
  }
}
