const knex = require('knex');
const path = require('path');

// Determine environment (default to development)
const environment = process.env.NODE_ENV || 'development';

console.log(`🌍 Environment: ${environment}`);

// PostgreSQL configuration for all environments
const knexConfig = {
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

const db = knex(knexConfig);

// Test database connection
const testConnection = async () => {
  try {
    // Test basic connectivity
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful');
    
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
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Connection config:', {
      client: knexConfig.client,
      host: knexConfig.connection?.host || 'N/A',
      database: knexConfig.connection?.database || 'N/A'
    });
    return false;
  }
};

module.exports = { db, testConnection, knexConfig };
