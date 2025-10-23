import { neon } from '@neondatabase/serverless';

// Initialize Neon client
const databaseUrl = process.env.DATABASE_URL;

console.log('🔧 Neon Database URL:', databaseUrl ? `${databaseUrl.substring(0, 20)}...` : 'Missing');

export const sql = databaseUrl ? neon(databaseUrl) : null;

// Helper function to check if database is configured
export function isDatabaseConfigured(): boolean {
  return sql !== null;
}
