import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { systemUser } from './system';

export const GalleryStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type GalleryStatus = (typeof GalleryStatus)[keyof typeof GalleryStatus];

export const galleryStatusEnum = pgEnum('GalleryStatus', [
  'ACTIVE',
  'INACTIVE',
]);

export const gallery = pgTable(
  'galleries',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => systemUser.id, { onDelete: 'cascade' }),

    title: varchar('title', { length: 200 }).notNull(),

    imageUrl: text('image_url'),

    // Optimized image size in bytes.
    size: integer('size').notNull(),

    altText: varchar('alt_text', { length: 255 }),

    status: galleryStatusEnum('status').notNull().default('ACTIVE'),

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
    index('galleries_tenant_status_idx').on(table.tenantId, table.status),
    index('galleries_tenant_created_at_idx').on(table.tenantId,table.createdAt,),
  ],
);
