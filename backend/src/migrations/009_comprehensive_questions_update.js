/**
 * Migration: Comprehensive questions table update for all question types
 * Updates the questions table schema to support all new question types
 */

exports.up = async function(knex) {
  try {
    console.log('🔄 Updating questions table for enhanced question types...');
    
    // Check if we need to add missing columns
    const tableExists = await knex.schema.hasTable('questions');
    if (!tableExists) {
      throw new Error('Questions table does not exist. Please run earlier migrations first.');
    }
    
    // Check for existing columns
    const hasCorrectAnswersData = await knex.schema.hasColumn('questions', 'correct_answers_data');
    const hasHint = await knex.schema.hasColumn('questions', 'hint');
    const hasFormattedText = await knex.schema.hasColumn('questions', 'formatted_text');
    const hasPairs = await knex.schema.hasColumn('questions', 'pairs');
    const hasItems = await knex.schema.hasColumn('questions', 'items');
    const hasCorrectOrder = await knex.schema.hasColumn('questions', 'correct_order');
    
    // Add missing columns
    const columnsToAdd = [];
    if (!hasCorrectAnswersData) columnsToAdd.push('correct_answers_data TEXT');
    if (!hasHint) columnsToAdd.push('hint TEXT');
    if (!hasFormattedText) columnsToAdd.push('formatted_text TEXT');
    if (!hasPairs) columnsToAdd.push('pairs TEXT');
    if (!hasItems) columnsToAdd.push('items TEXT');
    if (!hasCorrectOrder) columnsToAdd.push('correct_order TEXT');
    
    if (columnsToAdd.length > 0) {
      console.log(`Adding columns: ${columnsToAdd.join(', ')}`);\n      
      // Add columns one by one for SQLite compatibility\n      for (const column of columnsToAdd) {\n        const [columnName] = column.split(' ');\n        await knex.schema.alterTable('questions', table => {\n          table.text(columnName).nullable();\n        });\n      }\n    }\n    \n    // Check and update the type constraint for new question types\n    const sampleRow = await knex('questions').first();\n    if (sampleRow) {\n      // Test if we can insert a drag_drop_match type\n      try {\n        const testId = await knex('questions').insert({\n          quiz_id: sampleRow.quiz_id,\n          question_number: 9999,\n          type: 'drag_drop_match',\n          question_text: 'Test question',\n          explanation: 'Test'\n        });\n        \n        // If successful, delete the test row\n        await knex('questions').where('id', testId[0]).del();\n        console.log('✅ Question type constraints support new types');\n        \n      } catch (error) {\n        console.log('⚠️  Need to update type constraints, creating new table...');\n        \n        // Create new table with updated constraints\n        await knex.schema.raw(`\n          CREATE TABLE questions_enhanced (\n            id INTEGER PRIMARY KEY AUTOINCREMENT,\n            quiz_id INTEGER NOT NULL,\n            question_number INTEGER NOT NULL,\n            type TEXT CHECK (type IN (\n              'multiple_choice', \n              'fill_blank', \n              'fill_in_the_blank', \n              'true_false', \n              'matching',\n              'drag_drop_match',\n              'drag_drop_order'\n            )) DEFAULT 'multiple_choice',\n            question_text TEXT NOT NULL,\n            code_snippet TEXT,\n            options TEXT,\n            correct_answer TEXT,\n            correct_answers_data TEXT,\n            pairs TEXT,\n            items TEXT,\n            correct_order TEXT,\n            explanation TEXT,\n            difficulty TEXT,\n            concepts TEXT,\n            hint TEXT,\n            formatted_text TEXT,\n            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n            FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE\n          )\n        `);\n        \n        // Copy existing data\n        await knex.raw(`\n          INSERT INTO questions_enhanced (\n            id, quiz_id, question_number, type, question_text, code_snippet,\n            options, correct_answer, explanation, difficulty, concepts, created_at,\n            correct_answers_data, hint, formatted_text, pairs, items, correct_order\n          )\n          SELECT \n            id, quiz_id, question_number, type, question_text, code_snippet,\n            options, correct_answer, explanation, difficulty, concepts, created_at,\n            correct_answers_data, hint, formatted_text, pairs, items, correct_order\n          FROM questions\n        `);\n        \n        // Drop old table and rename new one\n        await knex.schema.dropTable('questions');\n        await knex.schema.raw('ALTER TABLE questions_enhanced RENAME TO questions');\n        \n        // Recreate indexes\n        await knex.schema.raw('CREATE INDEX IF NOT EXISTS questions_quiz_id_index ON questions (quiz_id)');\n        await knex.schema.raw('CREATE INDEX IF NOT EXISTS questions_question_number_index ON questions (question_number)');\n        \n        console.log('✅ Updated questions table with new type constraints');\n      }\n    }\n    \n    console.log('✅ Questions table enhancement completed successfully');\n    \n  } catch (error) {\n    console.error('❌ Error enhancing questions table:', error);\n    throw error;\n  }\n};\n\nexports.down = async function(knex) {\n  try {\n    console.log('🔄 Reverting questions table enhancement...');\n    \n    await knex.schema.alterTable('questions', table => {\n      // Remove added columns if they exist\n      const columnsToRemove = ['pairs', 'items', 'correct_order'];\n      columnsToRemove.forEach(col => {\n        try {\n          table.dropColumn(col);\n        } catch (e) {\n          // Column might not exist, ignore\n        }\n      });\n    });\n    \n    console.log('✅ Questions table enhancement reverted');\n    \n  } catch (error) {\n    console.error('❌ Error reverting questions table enhancement:', error);\n    throw error;\n  }\n};\n