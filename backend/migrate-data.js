const knex = require('knex');
require('dotenv').config({ path: './.env' });

const sqliteConfig = {
  client: 'sqlite3',
  connection: {
    filename: './data/quiz_app.db'
  },
  useNullAsDefault: true
};

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

const sqliteKnex = knex(sqliteConfig);
const pgKnex = knex(pgConfig);

async function migrateData() {
  try {
    console.log('Starting data migration...');

    const tables = [
      'users',
      'uploads',
      'quizzes',
      'questions',
      'quiz_attempts',
      'question_answers',
      'achievements',
      'user_achievements',
      'user_points',
      'user_stats',
      'roles',
      'permissions',
      'role_permissions',
      'answers',
      'attempts',
      'quiz_questions'
    ];

    for (const table of tables) {
      console.log(`Migrating data for table: ${table}`);
      
      try {
        const data = await sqliteKnex(table).select('*');
        
        if (data.length > 0) {
          const processedData = data.map(row => {
            const newRow = { ...row };
            
            // Convert Unix timestamps to ISO 8601 strings for PostgreSQL
            const timestampColumns = ['created_at', 'updated_at', 'upload_date', 'processed_date', 'started_at', 'completed_at', 'answered_at'];
            for (const col of timestampColumns) {
              if (newRow[col] && typeof newRow[col] === 'number') {
                newRow[col] = new Date(newRow[col]).toISOString();
              }
            }
            
            // Map unsupported question types to supported ones
            if (newRow.type === 'drag_drop_order') {
              newRow.type = 'matching'; // Map drag_drop_order to matching
            }
            
            // Handle JSON columns with improved logic - only actual JSON columns!
            const jsonColumns = ['options', 'concepts']; // Only these are actual JSON type in PostgreSQL
            for (const col of jsonColumns) {
              if (newRow[col] && typeof newRow[col] === 'string') {
                
                // Special handling for 'options' column - multiple choice format
                if (col === 'options') {
                  try {
                    // First try to parse as JSON
                    newRow[col] = JSON.parse(newRow[col]);
                  } catch (e) {
                    // If not JSON, check if it's multiple choice format (A) text\nB) text...)
                    if (newRow[col].includes('\n') && /^[A-Z]\)/.test(newRow[col])) {
                      // Split by newlines and clean up each option
                      const optionsArray = newRow[col]
                        .split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0)
                        .map(line => {
                          // Remove the letter prefix (A), B), etc.)
                          return line.replace(/^[A-Z]\)\s*/, '');
                        });
                      newRow[col] = optionsArray;
                    } else if (newRow[col].includes(',')) {
                      // Fallback to comma-separated
                      const array = newRow[col].split(',').map(item => item.trim());
                      newRow[col] = array;
                    } else {
                      // Single option
                      newRow[col] = [newRow[col]];
                    }
                  }
                  
                  // Convert array to JSON string for PostgreSQL
                  if (Array.isArray(newRow[col])) {
                    newRow[col] = JSON.stringify(newRow[col]);
                  }
                }
                // Handle 'concepts' column  
                else if (col === 'concepts') {
                  try {
                    newRow[col] = JSON.parse(newRow[col]);
                  } catch (e) {
                    console.warn(`Warning: Could not parse concepts JSON for table ${table}, ID ${newRow.id}. Value: ${newRow[col]}`);
                    newRow[col] = []; // Default to empty array for concepts
                  }
                  
                  // Convert array to JSON string for PostgreSQL
                  if (Array.isArray(newRow[col])) {
                    newRow[col] = JSON.stringify(newRow[col]);
                  }
                }
              }
            }
            
            return newRow;
          });
          
          await pgKnex(table).insert(processedData).onConflict('id').ignore();
          console.log(`✅ Migrated ${processedData.length} records for table: ${table}`);
        } else {
          console.log(`ℹ️  No records to migrate for table: ${table}`);
        }
      } catch (tableError) {
        if (tableError.message.includes('no such table')) {
          console.log(`⚠️  Table ${table} does not exist in source database, skipping...`);
        } else {
          console.error(`❌ Error migrating table ${table}:`, tableError.message);
          // Continue with other tables instead of stopping completely
        }
      }
    }

    console.log('🎉 Data migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during data migration:', error);
  } finally {
    try {
      await sqliteKnex.destroy();
      await pgKnex.destroy();
    } catch (cleanupError) {
      console.error('Error cleaning up connections:', cleanupError);
    }
  }
}

migrateData();