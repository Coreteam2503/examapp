/**
 * Migration: Data migration for existing records
 * Sets up default batch and assigns existing users and questions
 */

exports.up = async function(knex) {
  try {
    console.log('🔄 Starting data migration for existing records...');
    
    // Create default "General Batch" 
    console.log('🔄 Creating default General Batch...');
    const [defaultBatch] = await knex('batches').insert({
      name: 'General Batch',
      description: 'Default batch for all existing users and questions',
      subject: 'General',
      domain: 'General', 
      is_active: true,
      created_by: 1, // admin user
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }).returning('id');
    
    const batchId = defaultBatch.id || defaultBatch;
    console.log(`✅ Created default batch with ID: ${batchId}`);
    
    // Get all existing students (non-admin users)
    console.log('🔄 Finding existing students...');
    const students = await knex('users').where('role', 'student').select('id');
    console.log(`✅ Found ${students.length} students to assign to default batch`);
    
    // Assign all students to the default batch
    if (students.length > 0) {
      console.log('🔄 Assigning students to default batch...');
      const userBatchInserts = students.map(student => ({
        user_id: student.id,
        batch_id: batchId,
        enrolled_at: knex.fn.now(),
        is_active: true
      }));
      
      await knex('user_batches').insert(userBatchInserts);
      console.log(`✅ Assigned ${students.length} students to default batch`);
    }
    
    // Get all existing questions 
    console.log('🔄 Finding existing questions...');
    const questions = await knex('questions').select('id');
    console.log(`✅ Found ${questions.length} questions to assign to default batch`);
    
    // Assign all questions to the default batch
    if (questions.length > 0) {
      console.log('🔄 Assigning questions to default batch...');
      const questionBatchInserts = questions.map(question => ({
        question_id: question.id,
        batch_id: batchId,
        created_at: knex.fn.now()
      }));
      
      await knex('question_batches').insert(questionBatchInserts);
      console.log(`✅ Assigned ${questions.length} questions to default batch`);
    }
    
    console.log('🎉 Data migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Created 1 default batch`);
    console.log(`   - Assigned ${students.length} students to batch`); 
    console.log(`   - Assigned ${questions.length} questions to batch`);
    
  } catch (error) {
    console.error('❌ Error during data migration:', error);
    throw error;
  }
};

exports.down = async function(knex) {
  try {
    console.log('🔄 Reverting data migration...');
    
    // Remove all question-batch assignments
    await knex('question_batches').del();
    console.log('✅ Removed all question-batch assignments');
    
    // Remove all user-batch assignments  
    await knex('user_batches').del();
    console.log('✅ Removed all user-batch assignments');
    
    // Remove all batches
    await knex('batches').del();
    console.log('✅ Removed all batches');
    
    console.log('✅ Data migration reverted successfully');
    
  } catch (error) {
    console.error('❌ Error reverting data migration:', error);
    throw error;
  }
};
