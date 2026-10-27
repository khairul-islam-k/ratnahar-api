import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import { permissions, RbacFeature } from 'src/database/schema/rbc-permission';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is missing. Add it to the project .env file.');
}

const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle(pool);

const rows = [
  { featureKey: RbacFeature.Gallery, actionKey: 'read', description: 'View gallery images' },
  { featureKey: RbacFeature.Gallery, actionKey: 'create', description: 'Upload gallery images' },
  { featureKey: RbacFeature.Gallery, actionKey: 'update', description: 'Edit gallery images' },
  { featureKey: RbacFeature.Gallery, actionKey: 'delete', description: 'Delete gallery images' },
  { featureKey: RbacFeature.Employees, actionKey: 'read', description: 'View employees' },
  { featureKey: RbacFeature.Employees, actionKey: 'create', description: 'Create employees' },
  { featureKey: RbacFeature.Employees, actionKey: 'update', description: 'Edit employees and update their status' },
  { featureKey: RbacFeature.Employees, actionKey: 'delete', description: 'Delete employees' },
  { featureKey: RbacFeature.BusinessManagement, actionKey: 'read', description: 'View business management' },
  { featureKey: RbacFeature.BusinessManagement, actionKey: 'create', description: 'Create business management' },
  { featureKey: RbacFeature.BusinessManagement, actionKey: 'update', description: 'Update business management' },
  { featureKey: RbacFeature.BusinessManagement, actionKey: 'delete', description: 'Delete business management' },
] as const;

async function seedPermissions() {
  await db
    .insert(permissions)
    .values([...rows]) // spread because `as const` makes the array readonly
    .onConflictDoUpdate({
      target: [permissions.featureKey, permissions.actionKey],
      set: { description: sql`excluded.description` },
    });

  console.log(`Seeded ${rows.length} permissions`);
}

void seedPermissions()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => pool.end());
