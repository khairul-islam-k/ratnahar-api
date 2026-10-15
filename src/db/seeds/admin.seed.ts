import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import {
    systemUser,
    SystemUserStatus,
    SystemUserType,
} from 'src/database/schema/system';

async function seedAdmin() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe@123';
  const name = process.env.SEED_ADMIN_NAME ?? 'Super Admin';

  try {
    const [existing] = await db
      .select({ id: systemUser.id })
      .from(systemUser)
      .where(eq(systemUser.email, email))
      .limit(1);

    if (existing) {
      console.log(`Admin already exists: ${email}`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [admin] = await db
      .insert(systemUser)
      .values({
        name,
        email,
        passwordHash,
        type: SystemUserType.ADMIN,
        status: SystemUserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      })
      .returning({ id: systemUser.id, email: systemUser.email });

    // Self-reference audit column: admin created by itself
    await db
      .update(systemUser)
      .set({ createdById: admin.id, updatedById: admin.id })
      .where(eq(systemUser.id, admin.id));

    console.log(`Admin created: ${admin.email} (${admin.id})`);
  } catch (error) {
    console.error('Admin seed failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void seedAdmin();