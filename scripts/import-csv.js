/**
 * Import CSV dataset into MongoDB
 * 
 * Usage:
 *   node scripts/import-csv.js <file-path> [--clear]
 * 
 * Examples:
 *   node scripts/import-csv.js data/wallet_transactions_sample.csv
 *   node scripts/import-csv.js data/wallet_transactions_sample.csv --clear
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Transaction, User } = require('../db/json-db');

function parseDate(dateString) {
  // Handle MM/DD/YY format (e.g., "10/1/25")
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0]) - 1; // Month is 0-indexed in JS
    const day = parseInt(parts[1]);
    let year = parseInt(parts[2]);
    
    // Convert 2-digit year to 4-digit (assuming 2000s)
    if (year < 100) {
      year = 2000 + year;
    }
    
    return new Date(year, month, day);
  }
  
  // Try to parse as standard date string
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  return null;
}

function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  // Map CSV headers to database fields
  const fieldMap = {
    'transaction_id': 'transactionId',
    'user_id': 'userId',
    'merchant': 'merchant',
    'category': 'category',
    'amount': 'amount',
    'payment_method': 'paymentMethod',
    'location': 'location',
    'date': 'date'
  };
  
  // Parse rows
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Simple CSV parsing (handles quoted fields)
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Add last value
    
    const record = {};
    
    headers.forEach((header, index) => {
      let value = values[index] || '';
      
      // Map field name
      const dbField = fieldMap[header.toLowerCase()] || header;
      
      // Parse value based on field type
      if (dbField === 'amount') {
        value = parseFloat(value) || 0;
      } else if (dbField === 'date') {
        value = parseDate(value);
      } else if (typeof value === 'string') {
        value = value.trim();
      }
      
      record[dbField] = value;
    });
    
    records.push(record);
  }
  
  return records;
}

async function importCSV(filePath, clearExisting = false) {
  try {
    // Load JSON database
    const jsonDB = require('../db/json-db');
    jsonDB.loadDB();
    console.log('✅ JSON Database loaded');

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    console.log(`\n📂 Reading file: ${filePath}`);

    // Read and parse CSV
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = parseCSV(fileContent);

    console.log(`📊 Found ${data.length} records`);

    // Clear existing data if requested
    if (clearExisting) {
      console.log('🗑️  Clearing existing transactions...');
      await Transaction.deleteMany({});
      console.log('✅ Existing transactions cleared');
    }

    // Import data
    if (data.length === 0) {
      console.log('⚠️  No data to import');
      return;
    }

    console.log('📥 Importing transactions...');

    // Track unique users
    const uniqueUserIds = new Set();
    
    // Import transactions
    let importedCount = 0;
    let errors = [];
    let skippedCount = 0;

    for (let i = 0; i < data.length; i++) {
      try {
        const record = data[i];
        
        // Validate required fields
        if (!record.transactionId || !record.userId || !record.merchant || !record.amount) {
          console.warn(`⚠️  Skipping record ${i + 1}: Missing required fields`);
          skippedCount++;
          continue;
        }
        
        // Track user IDs
        uniqueUserIds.add(record.userId);
        
        // Check if transaction already exists
        const existing = await Transaction.findOne({ transactionId: record.transactionId });
        if (existing && !clearExisting) {
          console.warn(`⚠️  Transaction ${record.transactionId} already exists, skipping`);
          skippedCount++;
          continue;
        }
        
        // Create or update transaction
        if (existing) {
          await Transaction.findByIdAndUpdate(existing._id, record);
        } else {
          await Transaction.create({
            ...record,
            _id: `id_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
          });
        }
        
        importedCount++;

        if ((i + 1) % 50 === 0) {
          console.log(`   Imported ${i + 1}/${data.length} transactions...`);
        }
      } catch (error) {
        console.error(`❌ Error importing record ${i + 1}:`, error.message);
        errors.push({ record: i + 1, error: error.message });
      }
    }

    // Create or update users (if they don't exist)
    console.log('\n👥 Creating/updating users...');
    for (const userId of uniqueUserIds) {
      const existingUser = await User.findOne({ userId: userId });
      if (!existingUser) {
        await User.create({
          userId: userId,
          _id: `user_${userId}`,
          balance: 0
        });
      }
    }
    console.log(`✅ Processed ${uniqueUserIds.size} users`);

    console.log(`\n✅ Import complete!`);
    console.log(`   Successfully imported: ${importedCount} transactions`);
    if (skippedCount > 0) {
      console.log(`   Skipped: ${skippedCount} transactions`);
    }
    if (errors.length > 0) {
      console.log(`   Failed: ${errors.length} transactions`);
      if (errors.length <= 10) {
        errors.forEach(e => console.log(`   - Record ${e.record}: ${e.error}`));
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node scripts/import-csv.js <file-path> [--clear]');
  console.error('\nExamples:');
  console.error('  node scripts/import-csv.js data/wallet_transactions_sample.csv');
  console.error('  node scripts/import-csv.js data/wallet_transactions_sample.csv --clear');
  process.exit(1);
}

const filePath = args[0];
const clearExisting = args.includes('--clear');

importCSV(filePath, clearExisting);

