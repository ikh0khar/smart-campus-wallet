/**
 * Seed sample events into MongoDB
 * 
 * Usage:
 *   node scripts/seed-events.js [--clear]
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/database');
const { Event } = require('../models');
const { parseCSV } = require('../utils/csvParser');

async function seedEvents(clearExisting = false) {
  try {
    // Connect to database
    await connectDB();

    // Clear existing events if requested
    if (clearExisting) {
      console.log('🗑️  Clearing existing events...');
      await Event.deleteMany({});
      console.log('✅ Existing events cleared');
    }

    // Check if events already exist
    const existingCount = await Event.countDocuments();
    if (existingCount > 0 && !clearExisting) {
      console.log(`⚠️  ${existingCount} events already exist. Use --clear to replace them.`);
      process.exit(0);
    }

    // Load events from CSV
    const csvPath = path.join(__dirname, '../data/campus_events_sample.csv');
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }

    console.log('📂 Reading events from CSV...');
    const csvData = parseCSV(csvPath);

    console.log(`📊 Found ${csvData.length} events`);

    // Transform and insert events
    const eventsToInsert = csvData.map(row => ({
      eventId: row.event_id,
      name: row.name,
      category: row.category,
      location: row.location,
      startTime: row.start_time,
      tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
      cost: parseFloat(row.cost) || 0,
    }));

    console.log('📥 Seeding events...');
    const insertedEvents = await Event.insertMany(eventsToInsert, { ordered: false });

    console.log(`✅ Successfully seeded ${insertedEvents.length} events`);
    
    // Show sample
    console.log('\n📋 Sample events:');
    insertedEvents.slice(0, 5).forEach(event => {
      console.log(`   - ${event.name} (${event.category})`);
    });

    process.exit(0);
  } catch (error) {
    if (error.code === 11000) {
      console.error('❌ Duplicate event IDs found. Use --clear to replace existing events.');
    } else {
      console.error('❌ Seeding failed:', error.message);
    }
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const clearExisting = args.includes('--clear');

seedEvents(clearExisting);

