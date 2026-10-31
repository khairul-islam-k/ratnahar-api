import { PartialType } from '@nestjs/swagger';
import { CreatePaymentGatewayDto } from './create-payment_gateway.dto';

export class UpdatePaymentGatewayDto extends PartialType(CreatePaymentGatewayDto) {}
