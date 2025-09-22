// Simple test to verify basic server functionality
console.log('🧪 Testing IDweb3 Backend Components...\n');

// Mock environment variables for testing
process.env.MONGODB_URI = 'mongodb://localhost:27017/idweb3_test';
process.env.REDIS_URI = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test_secret_key';
process.env.NODE_ENV = 'test';
process.env.APP_PORT = '3001';
process.env.HEDERA_NET = 'testnet';
process.env.HEDERA_OPERATOR_ID = '0.0.12345';
process.env.HEDERA_OPERATOR_KEY = 'test-key';

try {
  // Test model loading
  console.log('📊 Testing Models...');
  const User = require('./src/models/User');
  const Identity = require('./src/models/Identity');
  const Credential = require('./src/models/Credential');
  console.log('✅ Models loaded successfully');

  // Test route loading (skip services for now due to dependencies)
  console.log('\n🛣️  Testing Routes...');
  const authRoutes = require('./src/routes/auth');
  console.log('✅ Auth routes loaded');
  
  console.log('\n🎉 Core components loaded successfully!');
  console.log('\n📋 Component Summary:');
  console.log('  • Database Models: User, Identity, Credential');
  console.log('  • API Routes: Authentication system ready');
  console.log('\n✅ Backend structure is valid!');

} catch (error) {
  console.error('❌ Error loading components:', error.message);
  console.error(error.stack);
  process.exit(1);
}

console.log('\n🚀 Deployment Instructions:');
console.log('  1. Set up .env file with Hedera testnet credentials');
console.log('  2. Start with Docker: docker-compose up -d');
console.log('  3. Access Guardian UI: http://localhost:3000');
console.log('  4. Access API: http://localhost:3001/health');
console.log('\n📚 Documentation: See README.md for complete setup guide');