import {
  AnyPgColumn,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const SystemUserType = {
  ADMIN: 'ADMIN',
  TENANT: 'TENANT',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type SystemUserType =
  (typeof SystemUserType)[keyof typeof SystemUserType];

export const systemUserTypeEnum = pgEnum('SystemUserType', [
  'ADMIN',
  'TENANT',
  'EMPLOYEE',
]);

export const SystemUserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

export type SystemUserStatus =
  (typeof SystemUserStatus)[keyof typeof SystemUserStatus];

export const systemUserStatusEnum = pgEnum('SystemUserStatus', [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
]);

export const systemUser = pgTable(
  'system_users',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    name: varchar('name', { length: 150 }).notNull(),

    email: varchar('email', { length: 255 }).unique().notNull(),

    phone: varchar('phone', { length: 30 }).unique(),

    passwordHash: text('password_hash').notNull(),

    type: systemUserTypeEnum('type').notNull(),

    status: systemUserStatusEnum('status').notNull(),

    emailVerifiedAt: timestamp('email_verified_at', {
      precision: 6,
      withTimezone: true,
      mode: 'date',
    }),

    tenantId: uuid('tenant_id').references((): AnyPgColumn => systemUser.id, {
      onDelete: 'set null',
    }),

    createdById: uuid('created_by').references(
      (): AnyPgColumn => systemUser.id,
      {
        onDelete: 'set null',
      },
    ),

    updatedById: uuid('updated_by').references(
      (): AnyPgColumn => systemUser.id,
      {
        onDelete: 'set null',
      },
    ),

    deletedById: uuid('deleted_by').references(
      (): AnyPgColumn => systemUser.id,
      {
        onDelete: 'set null',
      },
    ),

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

    deletedAt: timestamp('deleted_at', {
      precision: 6,
      withTimezone: true,
      mode: 'date',
    }),
  },

  (table) => [
    index('system_users_type_idx').on(table.type),
    index('system_users_status_idx').on(table.status),
    index('system_users_tenant_id_idx').on(table.tenantId),
    index('system_users_deleted_at_idx').on(table.deletedAt),
  ],
);
