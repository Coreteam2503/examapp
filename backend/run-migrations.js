// Run migrations to ensure database schema is current
const { db } = require('./src/config/database');

async function runMigrations() {
  console.log('🔄 RUNNING DATABASE MIGRATIONS...\n');
  
  try {
    // Run all pending migrations
    const [batchNo, log] = await db.migrate.latest({
      directory: './src/migrations'
    });
    
    if (log.length === 0) {
      console.log('✅ Database is already up to date');
    } else {
      console.log(`✅ Ran ${log.length} migrations:`);
      log.forEach(migration => {
        console.log(`   - ${migration}`);
      });
    }
    
    console.log(`\n📊 Current batch number: ${batchNo}`);
    
    // Check migration status
    const migrations = await db.migrate.status({
      directory: './src/migrations'
    });
    
    console.log('\n📋 Migration Status:');
    migrations[0].forEach(migration => {
      console.log(`   ✅ ${migration}`);
    });
    
    if (migrations[1].length > 0) {
      console.log('\n⏳ Pending Migrations:');
      migrations[1].forEach(migration => {
        console.log(`   ⏳ ${migration}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Migration failed:', error.message);
    console.log('Stack:', error.stack);
  } finally {
    await db.destroy();
  }
}

runMigrations();
