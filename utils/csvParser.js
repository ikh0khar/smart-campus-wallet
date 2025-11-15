const fs = require('fs');
const path = require('path');

/**
 * Parse CSV file and return array of objects
 * @param {string} filePath - Path to CSV file
 * @returns {Array} Array of objects with keys from header row
 */
function parseCSV(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      return [];
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      // Simple CSV parsing - split by comma and trim
      // For more complex CSVs with quoted fields, consider using a library
      const values = lines[i].split(',').map(v => v.trim());
      const obj = {};
      
      headers.forEach((header, index) => {
        obj[header] = values[index] !== undefined ? values[index] : '';
      });
      
      // Only add if row has at least one non-empty value
      if (Object.values(obj).some(v => v !== '')) {
        data.push(obj);
      }
    }
    
    return data;
  } catch (error) {
    console.error(`Error parsing CSV file ${filePath}:`, error);
    return [];
  }
}

module.exports = { parseCSV };

