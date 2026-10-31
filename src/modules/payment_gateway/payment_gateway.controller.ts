import { Body, Controller, Delete, Get, Param, ParseArrayPipe, Patch, Post } from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import { PaymentGatewayService } from './payment_gateway.service';
import { CreatePaymentGatewayDto } from './dto/create-payment_gateway.dto';
import { UpdatePaymentGatewayDto } from './dto/update-payment_gateway.dto';

@Controller('payment-gateway')
export class PaymentGatewayController {
  constructor(private readonly paymentGatewayService: PaymentGatewayService) {}

  @Post()
  @ApiBody({ type: [CreatePaymentGatewayDto] })
  create(
    @Body(new ParseArrayPipe({ items: CreatePaymentGatewayDto }))
    createPaymentGatewayDtos: CreatePaymentGatewayDto[],
  ) {
    return this.paymentGatewayService.create(createPaymentGatewayDtos);
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
