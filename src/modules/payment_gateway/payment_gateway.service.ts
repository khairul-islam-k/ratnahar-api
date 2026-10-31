import { Injectable } from '@nestjs/common';
import { CreatePaymentGatewayDto } from './dto/create-payment_gateway.dto';
import { UpdatePaymentGatewayDto } from './dto/update-payment_gateway.dto';

@Injectable()
export class PaymentGatewayService {
  create(createPaymentGatewayDtos: CreatePaymentGatewayDto[]) {
    console.log(createPaymentGatewayDtos[0].gatewayData);
    return 'This action adds a new paymentGateway';
  }

  findAll() {
    return `This action returns all paymentGateway`;
  }

  findOne(id: number) {
    return `This action returns a #${id} paymentGateway`;
  }

  update(id: number, updatePaymentGatewayDto: UpdatePaymentGatewayDto) {
    return `This action updates a #${id} paymentGateway`;
  }

  remove(id: number) {
    return `This action removes a #${id} paymentGateway`;
  }
}
