const { testConnection } = require('./src/config/database');
const knex = require('knex');
const knexConfig = require('./knexfile').development;

async function initializeDatabase() {
  console.log('🚀 Initializing Database...\n');
  
  try {
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    // Run migrations
    const db = knex(knexConfig);
    console.log('📊 Running database migrations...');
    await db.migrate.latest();
    console.log('✅ Migrations completed successfully\n');
    
    // Test each table creation
    const tables = ['users', 'uploads', 'quizzes', 'questions', 'quiz_attempts', 'question_answers'];
    
    for (const table of tables) {
      const exists = await db.schema.hasTable(table);
      console.log(`${exists ? '✅' : '❌'} Table '${table}': ${exists ? 'Created' : 'Missing'}`);
    }
    
    console.log('\n🎉 Database initialization completed successfully!');
    
    await db.destroy();
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
