import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { systemUser } from './system';

export const ShopStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

export type ShopStatus = (typeof ShopStatus)[keyof typeof ShopStatus];

export const shopStatusEnum = pgEnum('ShopStatus', [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
]);

export const shop = pgTable(
  'shops',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => systemUser.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 150 }).notNull(),

    logo: varchar('logo', { length: 2048 }),

    email: varchar('email', { length: 255 }).notNull(),

    phone: varchar('phone', { length: 30 }),

    address: varchar('address', { length: 500 }),

    district: varchar('district', { length: 100 }),

    city: varchar('city', { length: 100 }),

    country: varchar('country', { length: 100 }),

    websiteId: uuid('website_id'),

    defaultCurrency: varchar('default_currency', { length: 3 }).default('BDT'),

    status: shopStatusEnum('status').notNull().default('ACTIVE'),

    createdAt: timestamp('created_at', {
      precision: 6,
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', {
      precision: 6,
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('shops_tenant_name_uidx').on(table.tenantId, table.name),
    index('shops_tenant_status_idx').on(table.tenantId, table.status),
    index('shops_tenant_created_at_idx').on(table.tenantId, table.createdAt),
  ],
);
