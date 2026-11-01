import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreatePaymentGatewayDto } from './dto/create-payment_gateway.dto';
import { UpdatePaymentGatewayDto } from './dto/update-payment_gateway.dto';
import { encript } from 'src/common/encode_decode/encode_decode';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import type { Database } from 'src/database/database.types';
import { tenantPaymentGatewayConfigs } from 'src/database/schema/payment-gateway';
import { apiResponse } from 'src/common/interceptors/response.interceptor';

@Injectable()
export class PaymentGatewayService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  async create(createPaymentGatewayDtos: CreatePaymentGatewayDto[]) {
    if (createPaymentGatewayDtos.length === 0) {
      throw new BadRequestException('At least one payment gateway config is required');
    }

    const rows = await this.db
      .insert(tenantPaymentGatewayConfigs)
      .values(
        createPaymentGatewayDtos.map((config) => ({
          tenantId: config.tenantId,
          paymentGatewayId: config.paymentGatewayId,
          gatewayData: encript(config.gatewayData),
          isLive: config.isLive ?? false,
          status: config.status ?? 'active',
        })),
      )
      .returning();

    return apiResponse(rows, 'Payment gateway configs created successfully');
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
