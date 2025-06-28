import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables for test execution
export function loadTestEnv() {
  const envPath = resolve(process.cwd(), '.env.test');
  dotenv.config({ path: envPath });

  // Set default values
  if (!process.env['DATABASE_URL']) {
    process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:54322/team_spark_test';
  }

  if (!process.env['NEXT_PUBLIC_APP_URL']) {
    process.env['NEXT_PUBLIC_APP_URL'] = 'http://localhost:3001';
  }

  console.log('Environment loaded:', {
    DATABASE_URL: process.env['DATABASE_URL'] ? 'Set' : 'Not set',
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
  });
}
