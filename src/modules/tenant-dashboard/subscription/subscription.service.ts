import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import type { Database } from 'src/database/database.types';
import { apiResponse } from 'src/common/interceptors/response.interceptor';
import { eq } from 'drizzle-orm';
import { packages, subscriptions } from 'src/database/schema/subscription';

function addBillingCycle(startDate: Date, billingCycle: 'monthly' | 'yearly') {
  const year = startDate.getUTCFullYear() + (billingCycle === 'yearly' ? 1 : 0);
  const month = startDate.getUTCMonth() + (billingCycle === 'monthly' ? 1 : 0);
  const day = startDate.getUTCDate();
  const lastDayOfTargetMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  return new Date(Date.UTC(year, month, Math.min(day, lastDayOfTargetMonth)));
}

@Injectable()
export class SubscriptionService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}
  async create(createSubscriptionDto: CreateSubscriptionDto, tenantId: string) {
    const [packageRow] = await this.db
      .select()
      .from(packages)
      .where(eq(packages.id, createSubscriptionDto.packageId));

    if (!packageRow) throw new NotFoundException('Package not found');
    if (packageRow.status !== 'active') {
      throw new BadRequestException('This package is not available for purchase');
    }

    const price = createSubscriptionDto.billingCycle === 'monthly'
      ? packageRow.monthlyPrice
      : packageRow.yearlyPrice;
    if (price === null) {
      throw new BadRequestException(
        `This package does not have a ${createSubscriptionDto.billingCycle} price`,
      );
    }

    const startDate = new Date();
    const [subscription] = await this.db
      .insert(subscriptions)
      .values({
        tenantId,
        packageId: packageRow.id,
        billingCycle: createSubscriptionDto.billingCycle,
        startDate,
        endDate: addBillingCycle(startDate, createSubscriptionDto.billingCycle),
        autoRenew: createSubscriptionDto.autoRenew ?? true,
        status: 'active',
        priceSnapshot: price,
      })
      .returning();

    return apiResponse(subscription, 'Subscription purchased successfully');
  }

  async findAll() {
    const result = await this.db.query.packages.findMany({
      with: { modules: true },
      orderBy: (packageTable, { asc }) => [asc(packageTable.name)],
    });

    return apiResponse(result, 'Packages retrieved successfully');
  }

  findOne(id: number) {
    return `This action returns a #${id} subscription`;
  }

  update(id: number, updateSubscriptionDto: UpdateSubscriptionDto) {
    return `This action updates a #${id} subscription`;
  }

  remove(id: number) {
    return `This action removes a #${id} subscription`;
  }
}
