import {
  log,
  logError,
  logApiRequest,
  logSecurityEvent,
  logBusinessEvent,
  logPerformance,
} from '../src/lib/logger';

console.log('🧪 Testing logging functionality...\n');

// Test different log levels
console.log('1. Testing log levels:');
log.debug('This is a debug message', { debugData: 'test' });
log.info('This is an info message', { userId: '123' });
log.warn('This is a warning message', { threshold: 90 });
log.error('This is an error message', { errorCode: 'TEST_ERROR' });

// Test structured error logging
console.log('\n2. Testing error logging:');
try {
  throw new Error('Test error for logging');
} catch (error) {
  logError(error as Error, 'TestScript', { testId: 'error-test' });
}

// Test API request logging
console.log('\n3. Testing API request logging:');
logApiRequest('GET', '/api/users', 200, 150, 'user-123');
logApiRequest('POST', '/api/kudos', 201, 89, 'user-456');
logApiRequest('GET', '/api/health', 503, 1250);

// Test security event logging
console.log('\n4. Testing security event logging:');
logSecurityEvent('failed_login', 'medium', {
  ip: '192.168.1.100',
  attempts: 3,
  username: 'testuser',
});

logSecurityEvent('suspicious_activity', 'high', {
  ip: '10.0.0.1',
  action: 'mass_data_export',
  userId: 'user-789',
});

// Test business event logging
console.log('\n5. Testing business event logging:');
logBusinessEvent('user_registered', 'user-999', {
  email: 'newuser@example.com',
  referralSource: 'google',
});

logBusinessEvent('kudos_sent', 'user-111', {
  recipientId: 'user-222',
  points: 50,
  category: 'innovation',
});

// Test performance logging
console.log('\n6. Testing performance logging:');
logPerformance('database_query', 45, {
  query: 'SELECT * FROM users',
  table: 'users',
});

logPerformance('external_api_call', 1500, {
  service: 'slack',
  endpoint: '/api/conversations.list',
});

console.log('\n✅ Logging tests completed!');
console.log('\nCheck the console output above to verify logging is working correctly.');
console.log('In production, logs would be written to files in the logs/ directory.');
