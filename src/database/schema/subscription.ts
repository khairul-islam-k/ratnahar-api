import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { systemUser } from './system';

export const packagePricingTypeEnum = pgEnum('package_pricing_type', [
  'fixed',
  'custom',
]);

export const packageStatusEnum = pgEnum('package_status', [
  'active',
  'inactive',
]);

export const billingCycleEnum = pgEnum('billing_cycle', [
  'monthly',
  'yearly',
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'trialing',
  'past_due',
  'canceled',
  'expired',
]);

export const packages = pgTable(
  'packages',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: varchar('name', { length: 150 }).notNull(),
    slug: varchar('slug', { length: 150 }).notNull(),
    pricingType: packagePricingTypeEnum('pricing_type').notNull().default('fixed'),
    monthlyPrice: numeric('monthly_price', { precision: 12, scale: 2 }),
    yearlyPrice: numeric('yearly_price', { precision: 12, scale: 2 }),
    description: text('description'),
    status: packageStatusEnum('status').notNull().default('active'),
  },
  (table) => [
    uniqueIndex('packages_slug_uidx').on(table.slug),
  ],
);

export const packageModules = pgTable(
  'package_modules',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    packageId: uuid('package_id')
      .notNull()
      .references(() => packages.id, { onDelete: 'cascade' }),
    moduleKey: varchar('module_key', { length: 100 }).notNull(),
    isEnabled: boolean('is_enabled').notNull().default(true),
  },
  (table) => [
    uniqueIndex('package_modules_package_module_uidx').on(
      table.packageId,
      table.moduleKey,
    ),
  ],
);

export const packagesRelations = relations(packages, ({ many }) => ({
  modules: many(packageModules),
}));

export const packageModulesRelations = relations(packageModules, ({ one }) => ({
  package: one(packages, {
    fields: [packageModules.packageId],
    references: [packages.id],
  }),
}));

export const packageLimits = pgTable(
  'package_limits',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    packageId: uuid('package_id')
      .notNull()
      .references(() => packages.id, { onDelete: 'cascade' }),
    limitKey: varchar('limit_key', { length: 100 }).notNull(),
    limitValue: integer('limit_value').notNull(),
  },
  (table) => [
    uniqueIndex('package_limits_package_key_uidx').on(
      table.packageId,
      table.limitKey,
    ),
  ],
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => systemUser.id, { onDelete: 'cascade' }),
    packageId: uuid('package_id')
      .notNull()
      .references(() => packages.id, { onDelete: 'restrict' }),
    billingCycle: billingCycleEnum('billing_cycle').notNull(),
    startDate: date('start_date', { mode: 'date' }).notNull(),
    endDate: date('end_date', { mode: 'date' }),
    autoRenew: boolean('auto_renew').notNull().default(true),
    status: subscriptionStatusEnum('status').notNull().default('active'),
    priceSnapshot: numeric('price_snapshot', { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', {
      precision: 6,
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('subscriptions_tenant_id_idx').on(table.tenantId),
    index('subscriptions_package_id_idx').on(table.packageId),
    index('subscriptions_status_end_date_idx').on(table.status, table.endDate),
  ],
);
