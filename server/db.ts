import { PrismaClient } from '@prisma/client';
import pg from 'pg';
const { Pool } = pg;

let prismaInstance: PrismaClient | null = null;
let pgPoolInstance: pg.Pool | null = null;

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL?.trim();
}

export function isDatabaseConfigured(): boolean {
  const url = getDatabaseUrl();
  return Boolean(url && url.length > 10);
}

export function getPrisma(): PrismaClient | null {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    return null;
  }
  if (!prismaInstance) {
    try {
      // Ensure PgBouncer pooler compatibility by disabling prepared statement cache if pgbouncer is active
      let formattedUrl = dbUrl;
      if (formattedUrl.includes('pgbouncer=true') && !formattedUrl.includes('statement_cache_size=')) {
        formattedUrl += (formattedUrl.includes('?') ? '&' : '?') + 'statement_cache_size=0';
      }

      prismaInstance = new PrismaClient({
        datasources: {
          db: {
            url: formattedUrl,
          },
        },
      });
    } catch (err) {
      console.error('Failed to initialize Prisma Client:', err);
      return null;
    }
  }
  return prismaInstance;
}

export function getPgPool(): pg.Pool | null {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) return null;
  if (!pgPoolInstance) {
    try {
      pgPoolInstance = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('supabase') || dbUrl.includes('sslmode=require') || !dbUrl.includes('localhost')
          ? { rejectUnauthorized: false }
          : false,
        max: 5,
        connectionTimeoutMillis: 5000,
      });
    } catch (e) {
      console.error('Failed to initialize pg Pool:', e);
      return null;
    }
  }
  return pgPoolInstance;
}

export async function testConnection(): Promise<{
  connected: boolean;
  message: string;
  latencyMs?: number;
  serverTime?: string;
  counts?: {
    projects: number;
    testimonials: number;
    inquiries: number;
  };
}> {
  if (!isDatabaseConfigured()) {
    return {
      connected: false,
      message: 'DATABASE_URL environment variable is not configured.',
    };
  }

  const startTime = Date.now();
  const pool = getPgPool();
  if (!pool) {
    return { connected: false, message: 'Could not initialize database connection pool.' };
  }

  try {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT NOW() as server_time, version()');
      const latencyMs = Date.now() - startTime;

      // Check existing counts if tables exist
      let counts = { projects: 0, testimonials: 0, inquiries: 0 };
      try {
        const pRes = await client.query('SELECT count(*)::int as c FROM "Project"');
        const tRes = await client.query('SELECT count(*)::int as c FROM "Testimonial"');
        const iRes = await client.query('SELECT count(*)::int as c FROM "Inquiry"');
        counts = {
          projects: pRes.rows[0]?.c || 0,
          testimonials: tRes.rows[0]?.c || 0,
          inquiries: iRes.rows[0]?.c || 0,
        };
      } catch {
        // Tables might not exist yet
      }

      return {
        connected: true,
        message: 'Successfully connected to PostgreSQL database.',
        latencyMs,
        serverTime: res.rows[0]?.server_time,
        counts,
      };
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Database connection test error:', errorMsg);
    return {
      connected: false,
      message: `Failed to connect to database: ${errorMsg}`,
    };
  }
}

export async function ensureTablesExist(): Promise<{ success: boolean; message: string }> {
  const pool = getPgPool();
  if (!pool) {
    return { success: false, message: 'DATABASE_URL is not configured.' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "Project" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "categoryName" TEXT NOT NULL,
        "location" TEXT,
        "year" TEXT NOT NULL,
        "client" TEXT NOT NULL,
        "image" TEXT NOT NULL,
        "summary" TEXT NOT NULL,
        "challenge" TEXT,
        "solution" TEXT,
        "impactMetrics" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "liveUrl" TEXT,
        "githubUrl" TEXT,
        "status" TEXT NOT NULL DEFAULT 'published',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Testimonial" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "organization" TEXT NOT NULL,
        "country" TEXT,
        "serviceCategory" TEXT,
        "avatar" TEXT,
        "rating" INTEGER NOT NULL DEFAULT 5,
        "quote" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Inquiry" (
        "id" TEXT PRIMARY KEY,
        "fullName" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT,
        "serviceCategory" TEXT NOT NULL,
        "company" TEXT,
        "message" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'new',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "AdminSetting" (
        "id" TEXT PRIMARY KEY DEFAULT 'default',
        "username" TEXT NOT NULL DEFAULT 'admin',
        "email" TEXT NOT NULL DEFAULT 'admin@greatstargem.com',
        "password" TEXT,
        "recoveryKey" TEXT,
        "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 30,
        "publicApiEnabled" BOOLEAN NOT NULL DEFAULT true,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE "AdminSetting" ADD COLUMN IF NOT EXISTS "password" TEXT;
      ALTER TABLE "AdminSetting" ADD COLUMN IF NOT EXISTS "recoveryKey" TEXT;

      -- Drop unused API token and webhook secret columns from Supabase
      ALTER TABLE "AdminSetting" DROP COLUMN IF EXISTS "apiToken";
      ALTER TABLE "AdminSetting" DROP COLUMN IF EXISTS "webhookSecret";

      -- Ensure default row exists with a baseline recovery key so it is immediately visible in Supabase Table Editor
      INSERT INTO "AdminSetting" (id, username, email, "recoveryKey", "updatedAt")
      VALUES ('default', 'admin', 'admin@greatstargem.com', 'GreatStarGem-Recovery-Key-2026', CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO NOTHING;

      -- If the row exists but recoveryKey was null, initialize it
      UPDATE "AdminSetting"
      SET "recoveryKey" = 'GreatStarGem-Recovery-Key-2026'
      WHERE id = 'default' AND ("recoveryKey" IS NULL OR TRIM("recoveryKey") = '');
    `);

    await client.query('COMMIT');
    return { success: true, message: 'All database tables successfully initialized and synced.' };
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Failed to create database tables:', msg);
    return { success: false, message: `Error creating tables: ${msg}` };
  } finally {
    client.release();
  }
}
