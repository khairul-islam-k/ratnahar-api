import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { systemUser } from './system';

export const paymentGateways = pgTable(
  'payment_gateways',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: varchar('name', { length: 150 }).notNull(),
    slug: varchar('slug', { length: 150 }).notNull(),
  },
  (table) => [uniqueIndex('payment_gateways_slug_uidx').on(table.slug)],
);

export const tenantPaymentGatewayConfigStatusEnum = pgEnum(
  'tenant_payment_gateway_config_status',
  ['active', 'inactive'],
);

export const tenantPaymentGatewayConfigs = pgTable(
  'tenant_payment_gateway_configs',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => systemUser.id, { onDelete: 'cascade' }),
    paymentGatewayId: uuid('payment_gateway_id')
      .notNull()
      .references(() => paymentGateways.id, { onDelete: 'restrict' }),
    gatewayData: jsonb('gateway_data').notNull().default({}),
    isLive: boolean('is_live').notNull().default(false),
    status: tenantPaymentGatewayConfigStatusEnum('status')
      .notNull()
      .default('active'),
  },
  (table) => [
    uniqueIndex('tenant_payment_gateway_configs_tenant_gateway_uidx').on(
      table.tenantId,
      table.paymentGatewayId,
    ),
    index('tenant_payment_gateway_configs_status_idx').on(table.status),
  ],
);

export const paymentGatewaysRelations = relations(
  paymentGateways,
  ({ many }) => ({ configs: many(tenantPaymentGatewayConfigs) }),
);

export const tenantPaymentGatewayConfigsRelations = relations(
  tenantPaymentGatewayConfigs,
  ({ one }) => ({
    tenant: one(systemUser, {
      fields: [tenantPaymentGatewayConfigs.tenantId],
      references: [systemUser.id],
    }),
    paymentGateway: one(paymentGateways, {
      fields: [tenantPaymentGatewayConfigs.paymentGatewayId],
      references: [paymentGateways.id],
    }),
  }),
);
