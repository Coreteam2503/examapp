const knex = require('knex');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../data/quiz_app.db');
console.log('Database path:', dbPath);

const knexConfig = {
  client: 'sqlite3',
  connection: {
    filename: dbPath
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, '../migrations')
  },
  pool: {
    min: 2,
    max: 10, // Allow more connections for your user base
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    afterCreate: (conn, cb) => {
      // Optimized SQLite settings for 100-500 users
      conn.serialize(() => {
        conn.run('PRAGMA foreign_keys = ON');
        conn.run('PRAGMA journal_mode = WAL'); // WAL is better for multiple readers
        conn.run('PRAGMA synchronous = NORMAL');
        conn.run('PRAGMA temp_store = MEMORY');
        conn.run('PRAGMA mmap_size = 268435456'); // 256MB memory mapping
        conn.run('PRAGMA cache_size = 10000'); // 10MB cache
        conn.run('PRAGMA wal_autocheckpoint = 1000');
        conn.run('PRAGMA busy_timeout = 30000');
        cb();
      });
    }
  }
};

const db = knex(knexConfig);

// Test database connection and optimize for concurrent users
const testConnection = async () => {
  try {
    // Test basic connectivity
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Test write permissions
    try {
      await db.raw('CREATE TEMPORARY TABLE test_write (id INTEGER)');
      await db.raw('DROP TABLE test_write');
      console.log('✅ Database write permissions verified');
    } catch (writeError) {
      console.error('❌ Database write test failed:', writeError.message);
    }
    
    // Display optimized settings
    const settings = await Promise.all([
      db.raw('PRAGMA journal_mode'),
      db.raw('PRAGMA synchronous'),
      db.raw('PRAGMA cache_size'),
      db.raw('PRAGMA mmap_size')
    ]);
    
    console.log('📊 Database optimized for 100-500 users:');
    console.log('  Journal mode:', settings[0][0].journal_mode);
    console.log('  Synchronous:', settings[1][0].synchronous);
    console.log('  Cache size:', settings[2][0].cache_size, 'pages');
    console.log('  Memory mapping:', Math.round(settings[3][0].mmap_size / 1024 / 1024), 'MB');
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

module.exports = { db, testConnection, knexConfig };
