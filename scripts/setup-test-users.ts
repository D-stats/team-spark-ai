import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client
const supabaseUrl = 'http://localhost:54321';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test user definitions
const testUsers = [
  {
    email: 'admin@test.com',
    password: 'password123',
    metadata: {
      name: 'Admin User',
      role: 'ADMIN',
    },
  },
  {
    email: 'manager@test.com',
    password: 'password123',
    metadata: {
      name: 'Manager User',
      role: 'MANAGER',
    },
  },
  {
    email: 'member1@test.com',
    password: 'password123',
    metadata: {
      name: 'Member One',
      role: 'MEMBER',
    },
  },
  {
    email: 'member2@test.com',
    password: 'password123',
    metadata: {
      name: 'Member Two',
      role: 'MEMBER',
    },
  },
  {
    email: 'member3@test.com',
    password: 'password123',
    metadata: {
      name: 'Member Three',
      role: 'MEMBER',
    },
  },
];

async function createTestUsers() {
  console.log('Starting test user creation...');

  for (const user of testUsers) {
    try {
      // Create user
      const { error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: user.metadata,
      });

      if (error) {
        console.error(`❌ Failed to create ${user.email}:`, error.message);
      } else {
        console.log(`✅ Created ${user.email}`);
      }
    } catch (error) {
      console.error(`❌ Error creating ${user.email}:`, error);
    }
  }

  console.log('\n📝 Test user information:');
  console.log('Email                | Password      | Role');
  console.log('-------------------- | ------------- | --------');
  testUsers.forEach((user) => {
    console.log(`${user.email.padEnd(20)} | password123   | ${user.metadata.role}`);
  });
}

// Execute script
createTestUsers()
  .then(() => {
    console.log('\n✨ Setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
