const knex = require('knex');
const path = require('path');

const knexConfig = {
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, '../../data/quiz_app.db')
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, '../migrations')
  },
  pool: {
    afterCreate: (conn, cb) => {
      conn.run('PRAGMA foreign_keys = ON', cb);
    }
  }
};

const db = knex(knexConfig);

// Test database connection
const testConnection = async () => {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

module.exports = { db, testConnection, knexConfig };
