import {
  AnyPgColumn,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
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

    refreshTokenHash: text('refresh_token_hash'),

    type: systemUserTypeEnum('type').notNull(),

    status: systemUserStatusEnum('status').notNull(),

    emailVerifiedAt: timestamp('email_verified_at', {
      precision: 6,
      withTimezone: true,
      mode: 'date',
    }),

    photo: varchar('photo', { length: 2048 }),

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

export const userProfile = pgTable(
  'user_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    userId: uuid('user_id').notNull()
    .references(() => systemUser.id, { onDelete: 'cascade' }),

    gender: varchar('gender', { length: 30 }),

    dateOfBirth: date('date_of_birth', { mode: 'string' }),

    address: text('address'),

    city: varchar('city', { length: 100 }),

    state: varchar('state', { length: 100 }),

    postalCode: varchar('postal_code', { length: 30 }),

    country: varchar('country', { length: 100 }),

    emergencyContact: varchar('emergency_contact', { length: 50 }),

    notes: text('notes'),
  },
  (table) => [
    uniqueIndex('user_profiles_user_id_uidx').on(table.userId),
  ],
);
