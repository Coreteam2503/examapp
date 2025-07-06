/**
 * Global teardown for Playwright tests
 * Runs once after all tests complete
 */

async function globalTeardown() {
  console.log('🧹 Starting global teardown for ExamApp e2e tests...');
  
  // Add any cleanup logic here
  // For example: database cleanup, file cleanup, etc.
  
  console.log('✅ Global teardown completed successfully');
}

module.exports = globalTeardown;
