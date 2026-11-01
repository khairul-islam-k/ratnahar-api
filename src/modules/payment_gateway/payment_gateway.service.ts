import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreatePaymentGatewayDto } from './dto/create-payment_gateway.dto';
import { UpdatePaymentGatewayDto } from './dto/update-payment_gateway.dto';
import { encript } from 'src/common/encode_decode/encode_decode';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import type { Database } from 'src/database/database.types';
import { paymentGateways, tenantPaymentGatewayConfigs } from 'src/database/schema/payment-gateway';
import { apiResponse } from 'src/common/interceptors/response.interceptor';
import { eq } from 'drizzle-orm';

@Injectable()
export class PaymentGatewayService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}
  async createSingleConfig(config: CreatePaymentGatewayDto, tenantId: string) {
    const [gateway] = await this.db
    .select({name: paymentGateways.name})
    .from(paymentGateways)
    .where(eq(paymentGateways.id, config.paymentGatewayId))
    .limit(1);

    console.log('createGateWay', gateway);


    // const [row] = await this.db
    //   .insert(tenantPaymentGatewayConfigs)
    //   .values({
    //     tenantId,
    //     paymentGatewayId: config.paymentGatewayId,
    //     gatewayData: encript(config.gatewayData),
    //     isLive: config.isLive ?? false,
    //     status: config.status ?? 'active',
    //   })
    //   .returning();

    // return apiResponse(row, 'Payment gateway config created successfully');
  }

  async createMultipleConfig(createPaymentGatewayDtos: CreatePaymentGatewayDto[], tenantId: string) {

    if (createPaymentGatewayDtos.length === 0) {
      throw new BadRequestException('At least one payment gateway config is required');
    }

    const rows = await this.db
      .insert(tenantPaymentGatewayConfigs)
      .values(
        createPaymentGatewayDtos.map((config) => ({
          tenantId,
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
