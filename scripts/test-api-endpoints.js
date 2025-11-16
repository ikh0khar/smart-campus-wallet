/**
 * Test API endpoints to verify MongoDB migration
 * 
 * Usage:
 *   node scripts/test-api-endpoints.js [--server-url=http://localhost:3000]
 */

const http = require('http');

const SERVER_URL = process.argv.find(arg => arg.startsWith('--server-url='))?.split('=')[1] || 'http://localhost:5000';

// Helper function to make HTTP requests
function request(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 5000,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing MongoDB-Migrated API Endpoints');
  console.log('='.repeat(50));
  console.log(`Server: ${SERVER_URL}\n`);

  let passed = 0;
  let failed = 0;

  // Test 1: Health Check
  console.log('1️⃣  Testing Health Check...');
  try {
    const result = await request(`${SERVER_URL}/api/health`);
    if (result.status === 200 && result.data.status === 'OK') {
      console.log('   ✅ Health check passed\n');
      passed++;
    } else {
      console.log('   ❌ Health check failed:', result);
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Health check error:', error.message);
    failed++;
  }

  // Test 2: Get Transactions
  console.log('2️⃣  Testing GET /api/transactions...');
  try {
    const result = await request(`${SERVER_URL}/api/transactions`);
    if (result.status === 200 && result.data.success && result.data.data) {
      console.log(`   ✅ Retrieved ${result.data.count} transactions\n`);
      passed++;
    } else {
      console.log('   ❌ Get transactions failed:', result);
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Get transactions error:', error.message);
    failed++;
  }

  // Test 3: Get Transactions by User
  console.log('3️⃣  Testing GET /api/transactions?userId=U001...');
  try {
    const result = await request(`${SERVER_URL}/api/transactions?userId=U001`);
    if (result.status === 200 && result.data.success) {
      console.log(`   ✅ Retrieved ${result.data.count} transactions for U001\n`);
      passed++;
    } else {
      console.log('   ❌ Get user transactions failed:', result);
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Get user transactions error:', error.message);
    failed++;
  }

  // Test 4: Transaction Summary
  console.log('4️⃣  Testing GET /api/transactions/summary...');
  try {
    const result = await request(`${SERVER_URL}/api/transactions/summary?startDate=2025-10-01&endDate=2025-10-31`);
    if (result.status === 200 && result.data.success && result.data.data.total !== undefined) {
      console.log(`   ✅ Summary: Total $${result.data.data.total}, Count: ${result.data.data.count}\n`);
      passed++;
    } else {
      console.log('   ❌ Get summary failed:', result);
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Get summary error:', error.message);
    failed++;
  }

  // Test 5: Category Breakdown
  console.log('5️⃣  Testing GET /api/transactions/categories...');
  try {
    const result = await request(`${SERVER_URL}/api/transactions/categories`);
    if (result.status === 200 && result.data.success && Array.isArray(result.data.data)) {
      console.log(`   ✅ Retrieved ${result.data.data.length} categories\n`);
      passed++;
    } else {
      console.log('   ❌ Get categories failed:', result);
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Get categories error:', error.message);
    failed++;
  }

  // Test 6: Get Budgets
  console.log('6️⃣  Testing GET /api/budgets...');
  try {
    const result = await request(`${SERVER_URL}/api/budgets`);
    if (result.status === 200 && result.data.success && result.data.data) {
      console.log(`   ✅ Retrieved ${result.data.count} budgets\n`);
      passed++;
    } else {
      console.log('   ❌ Get budgets failed:', result);
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Get budgets error:', error.message);
    failed++;
  }

  // Test 7: Get Budget Alerts
  console.log('7️⃣  Testing GET /api/budgets/alerts...');
  try {
    const result = await request(`${SERVER_URL}/api/budgets/alerts?threshold=80`);
    if (result.status === 200 && result.data.success) {
      console.log(`   ✅ Retrieved ${result.data.count} budget alerts\n`);
      passed++;
    } else {
      console.log('   ❌ Get budget alerts failed:', result);
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Get budget alerts error:', error.message);
    failed++;
  }

  // Test 8: Create Budget (POST)
  console.log('8️⃣  Testing POST /api/budgets...');
  try {
    const newBudget = {
      name: 'Test Budget',
      category: 'food',
      amount: 100,
      period: 'monthly',
      startDate: '2025-12-01',
      endDate: '2025-12-31',
      userId: 'U001'
    };
    const result = await request(`${SERVER_URL}/api/budgets`, 'POST', newBudget);
    if (result.status === 201 && result.data.success && result.data.data.id) {
      console.log(`   ✅ Created budget with ID: ${result.data.data.id}\n`);
      passed++;
    } else {
      console.log('   ❌ Create budget failed:', result);
      failed++;
    }
  } catch (error) {
    console.log('   ❌ Create budget error:', error.message);
    failed++;
  }

  // Summary
  console.log('='.repeat(50));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('✅ All tests passed! MongoDB migration is working correctly.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Check server logs for details.\n');
    process.exit(1);
  }
}

// Check if server is running first
console.log('Checking if server is running...');
request(`${SERVER_URL}/api/health`)
  .then(() => {
    console.log('✅ Server is running\n');
    return runTests();
  })
  .catch(() => {
    console.error('\n❌ Server is not running!');
    console.error(`Please start the server first:`);
    console.error(`  npm run dev`);
    console.error(`\nThe server should run on http://localhost:5000 (or check your PORT in .env)`);
    process.exit(1);
  });

