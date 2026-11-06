import { Module } from '@nestjs/common';
import { PaymentGatewayService } from './payment_gateway.service';
import { PaymentGatewayController } from './payment_gateway.controller';
import { AdminGatewayController } from './admin_gateway.controller';

@Module({
  controllers: [PaymentGatewayController, AdminGatewayController],
  providers: [PaymentGatewayService],
})
export class PaymentGatewayModule {}
