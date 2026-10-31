import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { paymentGateways } from 'src/database/schema/payment-gateway';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is missing. Add it to the project .env file.');
}

const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle(pool);

const gateways = [
  { name: 'BKASH', slug: 'bkash' },
];

async function seedGateways() {
  await db
    .insert(paymentGateways)
    .values(gateways)
    .onConflictDoNothing({ target: paymentGateways.slug });

  console.log(`Seeded ${gateways.length} payment gateways`);
}

void seedGateways()
  .catch((err) => {
    console.error('Payment gateway seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
