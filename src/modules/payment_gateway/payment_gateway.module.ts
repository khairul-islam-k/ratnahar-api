import { Module } from '@nestjs/common';
import { PaymentGatewayService } from './payment_gateway.service';
import { PaymentGatewayController } from './payment_gateway.controller';

@Module({
  controllers: [PaymentGatewayController],
  providers: [PaymentGatewayService],
})
export class PaymentGatewayModule {}
