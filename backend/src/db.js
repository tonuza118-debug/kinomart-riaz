import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // Serverless-tuned: each function instance only ever needs 1 connection
  // at a time (one request at a time per instance), and Neon's pooler
  // (the "-pooler" host in your connection string) is what actually
  // handles many concurrent instances — so keep this small rather than
  // opening a bigger pool that's mostly wasted per cold start.
  max: 1,
  idleTimeoutMillis: 10000,
  // Neon's free tier can take a few seconds to wake a suspended compute on
  // the very first query after idling — give it room instead of failing fast.
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});
