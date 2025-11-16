/**
 * Seed sample budgets into MongoDB
 * 
 * Usage:
 *   node scripts/seed-budgets.js [--clear]
 */

require('dotenv').config();
const connectDB = require('../config/database');
const { Budget } = require('../models');

const sampleBudgets = [
  {
    userId: 'U001',
    name: 'Monthly Food Budget',
    category: 'food',
    amount: 200.00,
    period: 'monthly',
    startDate: new Date('2025-11-01'),
    endDate: new Date('2025-11-30'),
    isActive: true,
  },
  {
    userId: 'U001',
    name: 'Semester Books Budget',
    category: 'books',
    amount: 500.00,
    period: 'semester',
    startDate: new Date('2025-09-01'),
    endDate: new Date('2025-12-31'),
    isActive: true,
  },
  {
    userId: 'U001',
    name: 'Weekly Entertainment',
    category: 'entertainment',
    amount: 50.00,
    period: 'weekly',
    startDate: new Date('2025-11-04'),
    endDate: new Date('2025-11-10'),
    isActive: true,
  },
];

async function seedBudgets(clearExisting = false) {
  try {
    // Connect to database
    await connectDB();

    // Clear existing budgets if requested
    if (clearExisting) {
      console.log('🗑️  Clearing existing budgets...');
      await Budget.deleteMany({});
      console.log('✅ Existing budgets cleared');
    }

    // Check if budgets already exist
    const existingCount = await Budget.countDocuments();
    if (existingCount > 0 && !clearExisting) {
      console.log(`⚠️  ${existingCount} budgets already exist. Use --clear to replace them.`);
      process.exit(0);
    }

    // Insert sample budgets
    console.log('📥 Seeding budgets...');
    const insertedBudgets = await Budget.insertMany(sampleBudgets);

    console.log(`✅ Successfully seeded ${insertedBudgets.length} budgets`);
    
    insertedBudgets.forEach(budget => {
      console.log(`   - ${budget.name} (${budget.category})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const clearExisting = args.includes('--clear');

seedBudgets(clearExisting);

