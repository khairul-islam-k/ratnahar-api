import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreatePaymentGatewayDto } from './dto/create-payment_gateway.dto';
import { UpdatePaymentGatewayDto } from './dto/update-payment_gateway.dto';
import { encript } from 'src/common/encode_decode/encode_decode';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import type { Database } from 'src/database/database.types';
import { paymentGateways, tenantPaymentGatewayConfigs } from 'src/database/schema/payment-gateway';
import {
  apiResponse,
  paginatedResponse,
} from 'src/common/interceptors/response.interceptor';
import { asc, count, eq, sql } from 'drizzle-orm';
import { getTokens } from './payment_gateway_api';

@Injectable()
export class PaymentGatewayService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) { }
  async createSingleConfig(config: CreatePaymentGatewayDto, tenantId: string) {
    const configData = await this.commonConfig(config);

    const [row] = await this.db
      .insert(tenantPaymentGatewayConfigs)
      .values({
        tenantId,
        paymentGatewayId: config.paymentGatewayId,
        gatewayData: encript(configData),
        isLive: config.isLive ?? false,
        status: config.status ?? 'active',
      })
      .onConflictDoUpdate({
        target: [
          tenantPaymentGatewayConfigs.tenantId,
          tenantPaymentGatewayConfigs.paymentGatewayId,
        ],
        set: {
          gatewayData: encript(configData),
          isLive: config.isLive ?? false,
          status: config.status ?? 'active',
        },
      })
      .returning();

    return apiResponse(row, 'Payment gateway config saved successfully');
  }

  async createMultipleConfig(createPaymentGatewayDtos: CreatePaymentGatewayDto[], tenantId: string) {

    if (createPaymentGatewayDtos.length === 0) {
      throw new BadRequestException('At least one payment gateway config is required');
    }


    const values = await Promise.all(
      createPaymentGatewayDtos.map(async (config) => ({
          tenantId,
          paymentGatewayId: config.paymentGatewayId,
          gatewayData: encript(await this.commonConfig(config)),
          isLive: config.isLive ?? false,
          status: config.status ?? 'active',
      })),
    );

    const rows = await this.db
      .insert(tenantPaymentGatewayConfigs)
      .values(values)
      .onConflictDoUpdate({
        target: [
          tenantPaymentGatewayConfigs.tenantId,
          tenantPaymentGatewayConfigs.paymentGatewayId,
        ],
        set: {
          gatewayData: sql`excluded.gateway_data`,
          isLive: sql`excluded.is_live`,
          status: sql`excluded.status`,
        },
      })
      .returning();

    return apiResponse(rows, 'Payment gateway configs created successfully');
  }

  private async commonConfig(config: CreatePaymentGatewayDto) {
    const [gateway] = await this.db
      .select({ name: paymentGateways.name })
      .from(paymentGateways)
      .where(eq(paymentGateways.id, config.paymentGatewayId))
      .limit(1);

    if (!gateway) {
      throw new BadRequestException('Payment gateway was not found');
    }

    let tokens: unknown;
    try {
      tokens = await getTokens(config, gateway.name);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadGatewayException(`Payment gateway authentication failed: ${message}`);
    }

    if (
      typeof tokens !== 'object' ||
      tokens === null ||
      !('id_token' in tokens) ||
      typeof tokens.id_token !== 'string' ||
      !('refresh_token' in tokens) ||
      typeof tokens.refresh_token !== 'string'
    ) {
      throw new BadGatewayException('Payment gateway returned an invalid token response');
    }

    const configData = {
      ...config.gatewayData,
      access_token: tokens.id_token,
      refresh_token: tokens.refresh_token,
    };
    return configData;
  }

  async findAll(tenantId: string, page: number, limit: number) {
    const where = eq(tenantPaymentGatewayConfigs.tenantId, tenantId);
    const offset = (page - 1) * limit;

    const [rows, [totalResult]] = await Promise.all([
      this.db
        .select({
          id: tenantPaymentGatewayConfigs.id,
          tenantId: tenantPaymentGatewayConfigs.tenantId,
          paymentGatewayId: paymentGateways.id,
          gatewayName: paymentGateways.name,
          gatewaySlug: paymentGateways.slug,
          isLive: tenantPaymentGatewayConfigs.isLive,
          status: tenantPaymentGatewayConfigs.status,
        })
        .from(tenantPaymentGatewayConfigs)
        .innerJoin(
          paymentGateways,
          eq(tenantPaymentGatewayConfigs.paymentGatewayId, paymentGateways.id),
        )
        .where(where)
        .orderBy(asc(paymentGateways.name))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(tenantPaymentGatewayConfigs)
        .where(where),
    ]);

    const total = totalResult.total;
    return paginatedResponse(
      rows,
      { page, limit, total, totalPages: Math.ceil(total / limit) },
      'Payment gateway configs retrieved successfully',
    );
  }
}
