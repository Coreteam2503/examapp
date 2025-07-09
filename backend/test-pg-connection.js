const knex = require('knex');
require('dotenv').config({ path: './.env' });

async function testConnection() {
  console.log('🔍 Testing PostgreSQL connection...\n');
  
  const pgConfig = {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    }
  };

  const pgKnex = knex(pgConfig);

  try {
    // Test basic connection
    await pgKnex.raw('SELECT 1 as test');
    console.log('✅ PostgreSQL connection successful!');
    
    // Check if tables exist
    const tables = await pgKnex.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\n📋 Existing tables in PostgreSQL:');
    if (tables.rows.length === 0) {
      console.log('   No tables found - database appears to be empty');
    } else {
      tables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
    // Check local SQLite database
    console.log('\n🗃️  Checking local SQLite database...');
    const sqliteKnex = knex({
      client: 'sqlite3',
      connection: { filename: './data/quiz_app.db' },
      useNullAsDefault: true
    });
    
    try {
      const localTables = await sqliteKnex.raw("SELECT name FROM sqlite_master WHERE type='table'");
      console.log('\n📋 Tables in local SQLite:');
      localTables.forEach(row => {
        console.log(`   - ${row.name}`);
      });
      
      // Count records in main tables
      const mainTables = ['users', 'questions', 'quizzes', 'quiz_attempts'];
      console.log('\n📊 Record counts in local SQLite:');
      for (const table of mainTables) {
        try {
          const count = await sqliteKnex(table).count('* as count').first();
          console.log(`   ${table}: ${count.count} records`);
        } catch (e) {
          console.log(`   ${table}: table not found`);
        }
      }
      
      await sqliteKnex.destroy();
    } catch (sqliteError) {
      console.log('❌ Error connecting to local SQLite:', sqliteError.message);
    }
    
  } catch (error) {
    console.log('❌ PostgreSQL connection failed:', error.message);
    console.log('\nConnection details being used:');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Port: ${process.env.DB_PORT || 5432}`);
    console.log(`   User: ${process.env.DB_USER}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
  } finally {
    await pgKnex.destroy();
  }
}

testConnection();
