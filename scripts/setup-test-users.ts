import { createClient } from '@supabase/supabase-js';

// Supabase管理者クライアントの作成
const supabaseUrl = 'http://localhost:54321';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// テストユーザーの定義
const testUsers = [
  {
    email: 'admin@test.com',
    password: 'password123',
    metadata: {
      name: '管理者太郎',
      role: 'ADMIN',
    },
  },
  {
    email: 'manager@test.com',
    password: 'password123',
    metadata: {
      name: 'マネージャー花子',
      role: 'MANAGER',
    },
  },
  {
    email: 'member1@test.com',
    password: 'password123',
    metadata: {
      name: 'メンバー一郎',
      role: 'MEMBER',
    },
  },
  {
    email: 'member2@test.com',
    password: 'password123',
    metadata: {
      name: 'メンバー二郎',
      role: 'MEMBER',
    },
  },
  {
    email: 'member3@test.com',
    password: 'password123',
    metadata: {
      name: 'メンバー三郎',
      role: 'MEMBER',
    },
  },
];

async function createTestUsers() {
  console.log('テストユーザーの作成を開始します...');

  for (const user of testUsers) {
    try {
      // ユーザーを作成
      const { error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: user.metadata,
      });

      if (error) {
        console.error(`❌ ${user.email} の作成に失敗:`, error.message);
      } else {
        console.log(`✅ ${user.email} を作成しました`);
      }
    } catch (error) {
      console.error(`❌ ${user.email} の作成中にエラー:`, error);
    }
  }

  console.log('\n📝 テストユーザー情報:');
  console.log('Email                | Password      | Role');
  console.log('-------------------- | ------------- | --------');
  testUsers.forEach((user) => {
    console.log(`${user.email.padEnd(20)} | password123   | ${user.metadata.role}`);
  });
}

// スクリプト実行
createTestUsers()
  .then(() => {
    console.log('\n✨ セットアップが完了しました');
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });
