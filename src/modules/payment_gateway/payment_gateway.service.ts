import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreatePaymentGatewayDto } from './dto/create-payment_gateway.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentGatewayDto } from './dto/update-payment_gateway.dto';
import { decode, encript } from 'src/common/encode_decode/encode_decode';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import type { Database } from 'src/database/database.types';
import { paymentGatewayConfigs, paymentGateways } from 'src/database/schema/payment-gateway';
import { packages } from 'src/database/schema/subscription';
import {
  apiResponse,
  paginatedResponse,
} from 'src/common/interceptors/response.interceptor';
import { and, asc, count, eq, sql } from 'drizzle-orm';
import { createPaymentApi, getTokens } from './payment_gateway_api';

@Injectable()
export class PaymentGatewayService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}
  async createSingleConfig(config: CreatePaymentGatewayDto, tenantId: string) {
    const configData = await this.commonConfig(config);

    const [row] = await this.db
      .insert(paymentGatewayConfigs)
      .values({
        configOwner: tenantId,
        paymentGatewayId: config.paymentGatewayId,
        gatewayData: encript(configData),
        isLive: config.isLive ?? false,
        status: config.status ?? 'active',
      })
      .onConflictDoUpdate({
        target: [
          paymentGatewayConfigs.configOwner,
          paymentGatewayConfigs.paymentGatewayId,
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
          configOwner: tenantId,
          paymentGatewayId: config.paymentGatewayId,
          gatewayData: encript(await this.commonConfig(config)),
          isLive: config.isLive ?? false,
          status: config.status ?? 'active',
      })),
    );

    const rows = await this.db
      .insert(paymentGatewayConfigs)
      .values(values)
      .onConflictDoUpdate({
        target: [
          paymentGatewayConfigs.configOwner,
          paymentGatewayConfigs.paymentGatewayId,
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

  async createPayment(input: CreatePaymentDto, tenantId: string) {
    const [packageRow] = await this.db
      .select({
        id: packages.id,
        name: packages.name,
        pricingType: packages.pricingType,
        monthlyPrice: packages.monthlyPrice,
        yearlyPrice: packages.yearlyPrice,
        status: packages.status,
      })
      .from(packages)
      .where(eq(packages.id, input.packageId))
      .limit(1);

    if (!packageRow) {
      throw new BadRequestException('Package was not found');
    }
    if (packageRow.status !== 'active') {
      throw new BadRequestException('This package is not available for purchase');
    }

    const amount = input.billingCycle === 'monthly'
      ? packageRow.monthlyPrice
      : packageRow.yearlyPrice;

    if (amount === null) {
      throw new BadRequestException(
        `This package does not have a ${input.billingCycle} price`,
      );
    }

    const gatewayConfig = await this.getConfig(input.paymentGatewayId, tenantId);

    const payload = {
      payerReference: tenantId,
      callbackURL: input.callbackURL,
      amount,
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: `PAY-${randomUUID()}`,
    };

    const result = await createPaymentApi(gatewayConfig, payload);

    return apiResponse(
      result,
      'Payment created successfully',
    );
  }

  private async getConfig(paymentGatewayId: string, tenantId: string) {
    const [row] = await this.db
      .select({
        gatewayName: paymentGateways.name,
        gatewaySlug: paymentGateways.slug,
        gatewayData: paymentGatewayConfigs.gatewayData,
        isLive: paymentGatewayConfigs.isLive,
        status: paymentGatewayConfigs.status,
      })
      .from(paymentGatewayConfigs)
      .innerJoin(
        paymentGateways,
        eq(paymentGatewayConfigs.paymentGatewayId, paymentGateways.id),
      )
      .where(
        and(
          eq(paymentGatewayConfigs.configOwner, tenantId),
          eq(paymentGatewayConfigs.paymentGatewayId, paymentGatewayId),
        ),
      )
      .limit(1);

    if (!row || row.status !== 'active') {
      throw new BadRequestException(
        'Active payment gateway configuration was not found for this tenant',
      );
    }

    if (typeof row.gatewayData !== 'string') {
      throw new BadGatewayException('Payment gateway configuration is invalid');
    }

    try {
      return {
        ...row,
        gatewayData: decode<Record<string, unknown>>(row.gatewayData),
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadGatewayException(`Could not read payment gateway configuration: ${message}`);
    }
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

    if (gateway.name.trim().toUpperCase() === 'SSLCOMMERZ') {
      return config.gatewayData;
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
    const where = eq(paymentGatewayConfigs.configOwner, tenantId);
    const offset = (page - 1) * limit;

    const [rows, [totalResult]] = await Promise.all([
      this.db
        .select({
          id: paymentGatewayConfigs.id,
          tenantId: paymentGatewayConfigs.configOwner,
          paymentGatewayId: paymentGateways.id,
          gatewayName: paymentGateways.name,
          gatewaySlug: paymentGateways.slug,
          isLive: paymentGatewayConfigs.isLive,
          status: paymentGatewayConfigs.status,
        })
        .from(paymentGatewayConfigs)
        .innerJoin(
          paymentGateways,
          eq(paymentGatewayConfigs.paymentGatewayId, paymentGateways.id),
        )
        .where(where)
        .orderBy(asc(paymentGateways.name))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(paymentGatewayConfigs)
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
