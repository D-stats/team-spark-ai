import * as dotenv from 'dotenv';
import { resolve } from 'path';

// テスト実行時に環境変数を読み込む
export function loadTestEnv() {
  const envPath = resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
  
  // デフォルト値を設定
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:54322/postgres?schema=public';
  }
  
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  }
  
  console.log('Environment loaded:', {
    DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
}