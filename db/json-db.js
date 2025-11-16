/**
 * Simple JSON-based database
 * Works without MongoDB - uses JSON files for storage
 * Perfect for Railway and can work with Netlify Functions
 */

const fs = require('fs');
const path = require('path');

// Database directory
const DB_DIR = path.join(process.cwd(), 'data', 'db');
const DB_FILE = path.join(DB_DIR, 'database.json');

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize empty database
let db = null;

// Load database from file
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(data);
    } else {
      // Initialize with empty collections
      db = {
        users: [],
        transactions: [],
        budgets: [],
        events: [],
        eventAttendances: [],
        classAttendances: [],
        activityLogs: [],
        rewardPoints: [],
        streaks: [],
        achievements: [],
        _meta: {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      };
      saveDB();
    }
    return db;
  } catch (error) {
    console.error('Error loading database:', error);
    // Return fresh database if load fails
    db = {
      users: [],
      transactions: [],
      budgets: [],
      events: [],
      eventAttendances: [],
      classAttendances: [],
      activityLogs: [],
      rewardPoints: [],
      streaks: [],
      achievements: [],
      _meta: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };
    return db;
  }
}

// Save database to file
function saveDB() {
  try {
    if (!db) loadDB();
    db._meta.lastModified = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving database:', error);
    return false;
  }
}

// Initialize database
loadDB();

/**
 * Generic collection operations
 */
class Collection {
  constructor(name) {
    this.name = name;
    if (!db) loadDB();
    if (!db[name]) {
      db[name] = [];
      saveDB();
    }
  }

  // Find all documents matching query
  async find(query = {}) {
    if (!db) loadDB();
    let results = [...(db[this.name] || [])];
    
    // Apply filters
    if (Object.keys(query).length > 0) {
      results = results.filter(doc => {
        return Object.keys(query).every(key => {
          const queryValue = query[key];
          let docValue = doc[key];
          
          // Convert date strings to Date objects for comparison
          if (key === 'date' && typeof docValue === 'string') {
            docValue = new Date(docValue);
          }
          
          // Handle object queries (like $gte, $lte, $in)
          if (typeof queryValue === 'object' && queryValue !== null && !Array.isArray(queryValue) && !(queryValue instanceof Date)) {
            if (queryValue.$gte !== undefined) {
              const compare = queryValue.$gte instanceof Date ? queryValue.$gte : new Date(queryValue.$gte);
              return docValue >= compare;
            }
            if (queryValue.$lte !== undefined) {
              const compare = queryValue.$lte instanceof Date ? queryValue.$lte : new Date(queryValue.$lte);
              return docValue <= compare;
            }
            if (queryValue.$in !== undefined) {
              return queryValue.$in.some(val => {
                if (val instanceof RegExp) return val.test(docValue);
                return val === docValue;
              });
            }
            if (queryValue.$ne !== undefined) return docValue !== queryValue.$ne;
            // Handle RegExp
            if (queryValue instanceof RegExp) return queryValue.test(String(docValue));
          }
          
          // Handle RegExp directly
          if (queryValue instanceof RegExp) {
            return queryValue.test(String(docValue));
          }
          
          // Handle Date comparisons
          if (queryValue instanceof Date && docValue instanceof Date) {
            return docValue.getTime() === queryValue.getTime();
          }
          
          // Handle arrays (for $in)
          if (Array.isArray(queryValue)) {
            return queryValue.some(val => {
              if (val instanceof RegExp) return val.test(String(docValue));
              return val === docValue;
            });
          }
          
          // Exact match
          return docValue === queryValue;
        });
      });
    }
    
    // Return with lean() method for compatibility
    return {
      lean: async () => {
        // Convert date strings back to Date objects
        return results.map(doc => {
          const copy = { ...doc };
          if (copy.date && typeof copy.date === 'string') {
            copy.date = new Date(copy.date);
          }
          if (copy.createdAt && typeof copy.createdAt === 'string') {
            copy.createdAt = new Date(copy.createdAt);
          }
          if (copy.updatedAt && typeof copy.updatedAt === 'string') {
            copy.updatedAt = new Date(copy.updatedAt);
          }
          if (copy.startDate && typeof copy.startDate === 'string') {
            copy.startDate = new Date(copy.startDate);
          }
          if (copy.endDate && typeof copy.endDate === 'string') {
            copy.endDate = new Date(copy.endDate);
          }
          if (copy.startTime && typeof copy.startTime === 'string') {
            copy.startTime = new Date(copy.startTime);
          }
          return copy;
        });
      },
      sort: (sortObj) => {
        const sorted = [...results];
        const keys = Object.keys(sortObj);
        sorted.sort((a, b) => {
          for (const key of keys) {
            const order = sortObj[key];
            let aVal = a[key];
            let bVal = b[key];
            
            // Handle dates
            if (aVal instanceof Date || (typeof aVal === 'string' && aVal.match(/^\d{4}-\d{2}-\d{2}/))) {
              aVal = new Date(aVal);
            }
            if (bVal instanceof Date || (typeof bVal === 'string' && bVal.match(/^\d{4}-\d{2}-\d{2}/))) {
              bVal = new Date(bVal);
            }
            
            if (aVal < bVal) return -order;
            if (aVal > bVal) return order;
          }
          return 0;
        });
        return {
          lean: async () => sorted,
          exec: async (callback) => {
            if (callback) callback(null, sorted);
            return Promise.resolve(sorted);
          }
        };
      },
      exec: async (callback) => {
        if (callback) callback(null, results);
        return Promise.resolve(results);
      }
    };
  }

  // Find one document
  async findOne(query = {}) {
    const findResult = await this.find(query);
    const results = await findResult.lean();
    const result = results[0] || null;
    return Promise.resolve(result);
  }

  // Find by ID
  async findById(id) {
    const result = await this.findOne({ _id: id });
    return Promise.resolve(result);
  }

  // Create new document
  create(data) {
    if (!db) loadDB();
    const doc = {
      ...data,
      _id: data._id || `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: data.createdAt || new Date(),
      updatedAt: new Date()
    };
    
    // Convert Date objects to ISO strings for storage
    const sanitize = (obj) => {
      if (obj instanceof Date) return obj.toISOString();
      if (typeof obj === 'object' && obj !== null) {
        const result = {};
        for (const key in obj) {
          result[key] = sanitize(obj[key]);
        }
        return result;
      }
      return obj;
    };
    
    db[this.name].push(this.sanitize(doc));
    saveDB();
    return Promise.resolve(doc);
  }

  // Save document (for updates)
  save() {
    if (!db) loadDB();
    saveDB();
    return Promise.resolve(this);
  }

  // Update document
  findByIdAndUpdate(id, update, options = {}) {
    if (!db) loadDB();
    const index = db[this.name].findIndex(doc => doc._id === id || doc._id?.toString() === id?.toString());
    
    if (index === -1) {
      if (options.new !== false && options.upsert) {
        // Create new if upsert
        const newDoc = {
          ...update,
          _id: id || `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        db[this.name].push(newDoc);
        saveDB();
        return Promise.resolve(newDoc);
      }
      return Promise.resolve(null);
    }
    
    const updated = {
      ...db[this.name][index],
      ...update,
      updatedAt: new Date()
    };
    
    db[this.name][index] = updated;
    saveDB();
    
    return Promise.resolve(options.new !== false ? updated : db[this.name][index]);
  }

  // Delete document
  async findByIdAndDelete(id) {
    if (!db) loadDB();
    const index = db[this.name].findIndex(doc => doc._id === id || doc._id?.toString() === id?.toString());
    
    if (index === -1) return Promise.resolve(null);
    
    const deleted = db[this.name].splice(index, 1)[0];
    saveDB();
    return Promise.resolve(deleted);
  }
  
  // Delete one (MongoDB compatibility)
  async deleteOne(query) {
    if (!db) loadDB();
    const index = db[this.name].findIndex(doc => {
      return Object.keys(query).every(key => {
        return doc[key] === query[key] || doc[key]?.toString() === query[key]?.toString();
      });
    });
    
    if (index === -1) return Promise.resolve({ deletedCount: 0 });
    
    db[this.name].splice(index, 1);
    saveDB();
    return Promise.resolve({ deletedCount: 1 });
  }
  
  // Find one and update (MongoDB compatibility)
  async findOneAndUpdate(query, update, options = {}) {
    if (!db) loadDB();
    const index = db[this.name].findIndex(doc => {
      return Object.keys(query).every(key => {
        return doc[key] === query[key] || doc[key]?.toString() === query[key]?.toString();
      });
    });
    
    if (index === -1) {
      if (options.upsert) {
        const newDoc = {
          ...query,
          ...update,
          _id: `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        db[this.name].push(this.sanitize(newDoc));
        saveDB();
        return Promise.resolve(newDoc);
      }
      return Promise.resolve(null);
    }
    
    const updated = {
      ...db[this.name][index],
      ...update,
      updatedAt: new Date()
    };
    
    db[this.name][index] = this.sanitize(updated);
    saveDB();
    
    return Promise.resolve(options.new !== false ? updated : db[this.name][index]);
  }
  
  // Helper to sanitize dates
  sanitize(obj) {
    if (obj instanceof Date) return obj.toISOString();
    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      const result = {};
      for (const key in obj) {
        result[key] = this.sanitize(obj[key]);
      }
      return result;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitize(item));
    }
    return obj;
  }

  // Count documents
  async countDocuments(query = {}) {
    const findResult = await this.find(query);
    const results = await findResult.lean();
    return Promise.resolve(results.length);
  }

  // Distinct values
  async distinct(field, query = {}) {
    const findResult = await this.find(query);
    const results = await findResult.lean();
    const values = [...new Set(results.map(doc => doc[field]).filter(v => v !== undefined))];
    return Promise.resolve(values);
  }

  // Delete all matching
  deleteMany(query = {}) {
    if (!db) loadDB();
    const before = db[this.name].length;
    db[this.name] = db[this.name].filter(doc => {
      return !Object.keys(query).every(key => {
        return doc[key] === query[key];
      });
    });
    const deleted = before - db[this.name].length;
    saveDB();
    return Promise.resolve({ deletedCount: deleted });
  }

  // Update many
  updateMany(query, update) {
    if (!db) loadDB();
    let updated = 0;
    db[this.name] = db[this.name].map(doc => {
      const matches = Object.keys(query).every(key => {
        return doc[key] === query[key];
      });
      if (matches) {
        updated++;
        return { ...doc, ...update, updatedAt: new Date() };
      }
      return doc;
    });
    saveDB();
    return Promise.resolve({ modifiedCount: updated });
  }
}

// Export collections (MongoDB-like interface)
module.exports = {
  User: new Collection('users'),
  Transaction: new Collection('transactions'),
  Budget: new Collection('budgets'),
  Event: new Collection('events'),
  EventAttendance: new Collection('eventAttendances'),
  ClassAttendance: new Collection('classAttendances'),
  ActivityLog: new Collection('activityLogs'),
  RewardPoints: new Collection('rewardPoints'),
  Streak: new Collection('streaks'),
  Achievement: new Collection('achievements'),
  
  // Helper functions
  loadDB,
  saveDB,
  
  // Get raw database (for migrations/backups)
  getDB: () => {
    if (!db) loadDB();
    return db;
  },
  
  // Clear database (for testing)
  clearDB: () => {
    db = {
      users: [],
      transactions: [],
      budgets: [],
      events: [],
      eventAttendances: [],
      classAttendances: [],
      activityLogs: [],
      rewardPoints: [],
      streaks: [],
      achievements: [],
      _meta: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };
    saveDB();
  }
};

