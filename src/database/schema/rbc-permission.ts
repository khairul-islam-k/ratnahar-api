import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { systemUser } from './system';

export const permissionFeatureEnum = pgEnum('permission_feature', [
  'Gallery',
  'Permission',
]);

export const permissionActionEnum = pgEnum('permission_action', [
  'read',
  'create',
  'update',
  'delete',
]);
import { AnyPgColumn } from 'drizzle-orm/pg-core';

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    tenantId: uuid('tenant_id').references(():AnyPgColumn => systemUser.id, {
      onDelete: 'cascade',
    }),

    name: varchar('name', { length: 150 }).notNull(),

    slug: varchar('slug', { length: 150 }).notNull(),

    description: text('description'),

    isSystemRole: boolean('is_system_role').notNull().default(false),

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
    uniqueIndex('roles_tenant_slug_uidx').on(table.tenantId, table.slug),
    index('roles_tenant_id_idx').on(table.tenantId),
  ],
);

export const permissions = pgTable(
  'permissions',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    featureKey: permissionFeatureEnum('feature_key').notNull(),

    actionKey: permissionActionEnum('action_key').notNull(),

    description: text('description'),
  },
  (table) => [
    uniqueIndex('permissions_feature_action_uidx').on(
      table.featureKey,
      table.actionKey,
    ),
  ],
);

export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),

    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('role_permissions_role_permission_uidx').on(
      table.roleId,
      table.permissionId,
    ),
    index('role_permissions_permission_id_idx').on(table.permissionId),
  ],
);

export const userRoles = pgTable(
  'user_roles',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    userId: uuid('user_id')
      .notNull()
      .references(() => systemUser.id, { onDelete: 'cascade' }),

    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('user_roles_user_role_uidx').on(table.userId, table.roleId),
    index('user_roles_role_id_idx').on(table.roleId),
  ],
);
