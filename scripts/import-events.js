/**
 * Import events from CSV into JSON database
 * 
 * Usage:
 *   node scripts/import-events.js [--clear]
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Event } = require('../db/json-db');

function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
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
      record[header.toLowerCase()] = value.trim();
    });
    
    records.push(record);
  }
  
  return records;
}

async function importEvents(clearExisting = false) {
  try {
    // Load JSON database
    const jsonDB = require('../db/json-db');
    jsonDB.loadDB();
    console.log('✅ JSON Database loaded');

    // Check if file exists
    const csvPath = path.join(__dirname, '../data/campus_events_sample.csv');
    if (!fs.existsSync(csvPath)) {
      throw new Error(`File not found: ${csvPath}`);
    }

    console.log(`\n📂 Reading file: ${csvPath}`);

    // Read and parse CSV
    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const data = parseCSV(fileContent);

    console.log(`📊 Found ${data.length} events`);

    // Clear existing events if requested
    if (clearExisting) {
      console.log('🗑️  Clearing existing events...');
      await Event.deleteMany({});
      console.log('✅ Existing events cleared');
    }

    // Import events
    if (data.length === 0) {
      console.log('⚠️  No data to import');
      return;
    }

    console.log('📥 Importing events...');

    let importedCount = 0;
    let errors = [];
    let skippedCount = 0;

    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        
        // Validate required fields
        if (!row.event_id || !row.name) {
          console.warn(`⚠️  Skipping record ${i + 1}: Missing required fields`);
          skippedCount++;
          continue;
        }
        
        // Check if event already exists
        const existing = await Event.findOne({ eventId: row.event_id });
        if (existing && !clearExisting) {
          console.warn(`⚠️  Event ${row.event_id} already exists, skipping`);
          skippedCount++;
          continue;
        }
        
        // Parse cost and determine if paid/free
        const cost = parseFloat(row.cost) || 0;
        const isPaid = cost > 0;
        
        // Parse tags
        const tags = row.tags ? row.tags.split(',').map(t => t.trim()).filter(t => t) : [];
        
        // Parse start time - handle "YYYY-MM-DD HH:MM" format
        let startTime = row.start_time || new Date().toISOString();
        let startTimeDate;
        
        if (typeof startTime === 'string') {
          // Replace space with T for ISO format: "2025-11-05 17:00" -> "2025-11-05T17:00:00Z"
          if (startTime.includes(' ')) {
            startTime = startTime.replace(' ', 'T');
            if (!startTime.includes(':')) {
              startTime += ':00:00Z';
            } else if (startTime.split(':').length === 2) {
              startTime += ':00Z';
            } else if (!startTime.endsWith('Z') && !startTime.includes('+')) {
              startTime += 'Z';
            }
          } else if (!startTime.includes('T')) {
            startTime = `${startTime}T12:00:00Z`;
          }
        }
        
        startTimeDate = new Date(startTime);
        if (isNaN(startTimeDate.getTime())) {
          // Fallback to current date if parsing fails
          startTimeDate = new Date();
        }
        
        const eventData = {
          eventId: row.event_id,
          name: row.name,
          category: row.category || 'Other',
          location: row.location || '',
          startTime: startTimeDate,
          tags: tags,
          cost: cost,
          isPaid: isPaid,
          description: isPaid ? `$${cost.toFixed(2)}` : 'Free Event'
        };
        
        // Create or update event
        if (existing) {
          await Event.findByIdAndUpdate(existing._id, eventData);
        } else {
          await Event.create({
            ...eventData,
            _id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
          });
        }
        
        importedCount++;

      } catch (error) {
        console.error(`❌ Error importing record ${i + 1}:`, error.message);
        errors.push({ record: i + 1, error: error.message });
      }
    }

    console.log(`\n✅ Import complete!`);
    console.log(`   Successfully imported: ${importedCount} events`);
    if (skippedCount > 0) {
      console.log(`   Skipped: ${skippedCount} events`);
    }
    if (errors.length > 0) {
      console.log(`   Failed: ${errors.length} events`);
      if (errors.length <= 10) {
        errors.forEach(e => console.log(`   - Record ${e.record}: ${e.error}`));
      }
    }
    
    // Show sample
    const allEventsResult = await Event.find({});
    const allEvents = await allEventsResult.lean();
    console.log('\n📋 Sample events:');
    const sampleEvents = allEvents.slice(0, 5);
    sampleEvents.forEach(event => {
      const costLabel = event.isPaid ? `$${event.cost}` : 'Free';
      console.log(`   - ${event.name} (${event.category}) - ${costLabel}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const clearExisting = args.includes('--clear');

importEvents(clearExisting);

