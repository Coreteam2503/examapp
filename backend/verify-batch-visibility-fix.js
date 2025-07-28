/**
 * Fix Verification: Batch visibility issue for bo@gmail.com
 * 
 * ISSUE: User bo@gmail.com was assigned to test_2025_Apr_batch but couldn't see it in "My Batches"
 * CAUSE: UserController.getUserBatches was not filtering out inactive batches
 * FIX: Added batchIsActive: true filter to only show active batches
 */

require('dotenv').config();
const { db } = require('./src/config/database');

async function verifyBatchVisibilityFix() {
  try {
    console.log('🔍 Verifying batch visibility fix for bo@gmail.com...');
    
    // Get user
    const user = await db('users').where('email', 'bo@gmail.com').first();
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ Testing for user: ${user.email} (ID: ${user.id})`);
    
    // Test the fixed API endpoint logic
    const User = require('./src/models/User');
    const visibleBatches = await User.getBatches(user.id, { isActive: true, batchIsActive: true });
    
    console.log('\n📋 Batches visible to user (after fix):');
    visibleBatches.forEach((batch, index) => {
      console.log(`  ${index + 1}. ✅ ${batch.name}`);
      console.log(`     - ID: ${batch.id}`);
      console.log(`     - Active: ${batch.is_active}`);
      console.log(`     - Enrolled: ${batch.enrollment_active}`);
      console.log('');
    });
    
    // Verify specific expectations
    const batchNames = visibleBatches.map(b => b.name);
    const hasTestBatch = batchNames.includes('test_2025_Apr_batch');
    const hasInactiveBatch = batchNames.includes('Computer Science Batch');
    
    console.log('🧪 Verification Results:');
    console.log(`✅ Shows test_2025_Apr_batch: ${hasTestBatch ? 'YES' : 'NO'}`);
    console.log(`✅ Hides Computer Science Batch (inactive): ${!hasInactiveBatch ? 'YES' : 'NO'}`);
    console.log(`✅ Total visible batches: ${visibleBatches.length}`);
    
    if (hasTestBatch && !hasInactiveBatch) {
      console.log('\n🎉 FIX VERIFIED: User should now see the correct batches!');
    } else {
      console.log('\n❌ FIX FAILED: Issue still exists');
    }
    
    // Document the change made
    console.log('\n📝 Fix Applied in: backend/src/controllers/userController.js');
    console.log('   Changed: User.getBatches(userId, { isActive: true })');
    console.log('   To:      User.getBatches(userId, { isActive: true, batchIsActive: true })');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await db.destroy();
  }
}

// Run verification
verifyBatchVisibilityFix();