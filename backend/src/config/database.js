const knex = require('knex');
const path = require('path');

// Determine environment (default to development)
const environment = process.env.NODE_ENV || 'development';

console.log(`🌍 Environment: ${environment}`);

let knexConfig;

if (environment === 'production') {
  // PostgreSQL configuration for production
  knexConfig = {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    },
    migrations: {
      directory: path.join(__dirname, '../migrations')
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000
    }
  };
  
  console.log(`📡 Using PostgreSQL database at ${process.env.DB_HOST}:${process.env.DB_PORT}`);
} else {
  // SQLite configuration for development
  const dbPath = path.resolve(__dirname, '../../data/quiz_app.db');
  console.log('📁 Database path:', dbPath);
  
  knexConfig = {
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
      max: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      afterCreate: (conn, cb) => {
        // Optimized SQLite settings
        conn.serialize(() => {
          conn.run('PRAGMA foreign_keys = ON');
          conn.run('PRAGMA journal_mode = WAL');
          conn.run('PRAGMA synchronous = NORMAL');
          conn.run('PRAGMA temp_store = MEMORY');
          conn.run('PRAGMA mmap_size = 268435456');
          conn.run('PRAGMA cache_size = 10000');
          conn.run('PRAGMA wal_autocheckpoint = 1000');
          conn.run('PRAGMA busy_timeout = 30000');
          cb();
        });
      }
    }
  };
}

const db = knex(knexConfig);

// Test database connection
const testConnection = async () => {
  try {
    // Test basic connectivity
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful');
    
    if (environment === 'production') {
      // PostgreSQL specific tests
      console.log('🔍 Testing PostgreSQL connection...');
      const version = await db.raw('SELECT version()');
      console.log('📊 PostgreSQL version:', version.rows[0].version.split(' ')[1]);
      
      // Test table existence
      const tableCheck = await db.raw(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'questions'
      `);
      
      if (tableCheck.rows.length > 0) {
        const questionCount = await db('questions').count('* as count').first();
        console.log('📝 Questions in database:', questionCount.count);
      } else {
        console.log('⚠️  Questions table not found - may need to run migrations');
      }
    } else {
      // SQLite specific tests
      console.log('🔍 Testing SQLite connection...');
      try {
        await db.raw('CREATE TEMPORARY TABLE test_write (id INTEGER)');
        await db.raw('DROP TABLE test_write');
        console.log('✅ Database write permissions verified');
      } catch (writeError) {
        console.error('❌ Database write test failed:', writeError.message);
      }
      
      // Display SQLite settings
      const settings = await Promise.all([
        db.raw('PRAGMA journal_mode'),
        db.raw('PRAGMA synchronous'),
        db.raw('PRAGMA cache_size'),
        db.raw('PRAGMA mmap_size')
      ]);
      
      console.log('📊 SQLite optimized settings:');
      console.log('  Journal mode:', settings[0][0].journal_mode);
      console.log('  Synchronous:', settings[1][0].synchronous);
      console.log('  Cache size:', settings[2][0].cache_size, 'pages');
      console.log('  Memory mapping:', Math.round(settings[3][0].mmap_size / 1024 / 1024), 'MB');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Connection config:', {
      client: knexConfig.client,
      host: knexConfig.connection?.host || 'N/A',
      database: knexConfig.connection?.database || knexConfig.connection?.filename || 'N/A'
    });
    return false;
  }
};

module.exports = { db, testConnection, knexConfig };
