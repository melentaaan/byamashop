import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

const ROOT = join(import.meta.dirname, '..', '..');
const BASE = { host: process.env.PGTEST_HOST ?? '127.0.0.1', port: Number(process.env.PGTEST_PORT ?? 54329), user: 'postgres' };

export async function createTestDatabase(name: string): Promise<pg.Client> {
  const admin = new pg.Client({ ...BASE, database: 'postgres' });
  await admin.connect();
  await admin.query(`drop database if exists ${name} with (force)`);
  await admin.query(`create database ${name}`);
  await admin.end();

  const db = new pg.Client({ ...BASE, database: name });
  await db.connect();
  await db.query(readFileSync(join(ROOT, 'tests/db/supabase-shim.sql'), 'utf8'));
  const dir = join(ROOT, 'supabase/migrations');
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
    await db.query(readFileSync(join(dir, f), 'utf8'));
  }
  await db.query(readFileSync(join(ROOT, 'supabase/seed.sql'), 'utf8'));
  return db;
}

export type Role = 'anon' | 'authenticated';

/**
 * Exécute une requête avec les droits d'un rôle Supabase (anon / authenticated + utilisateur),
 * exactement comme PostgREST : SET ROLE + claims JWT, dans une transaction.
 */
export async function asRole<T = Record<string, unknown>>(
  db: pg.Client, role: Role, userId: string | null, sql: string, params: unknown[] = [], headers: Record<string, string> = {},
): Promise<T[]> {
  await db.query('begin');
  try {
    await db.query(`select set_config('request.jwt.claim.sub', $1, true), set_config('request.headers', $2, true)`, [userId ?? '', JSON.stringify(headers)]);
    await db.query(`set local role ${role}`);
    const res = await db.query(sql, params);
    await db.query('commit');
    return res.rows as T[];
  } catch (e) {
    await db.query('rollback');
    throw e;
  }
}

export async function createUser(db: pg.Client, email: string, admin = false): Promise<string> {
  const { rows } = await db.query('insert into auth.users (email) values ($1) returning id', [email]);
  const id = rows[0].id as string;
  if (admin) await db.query(`select public.grant_admin($1)`, [email]);
  return id;
}
