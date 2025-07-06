/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */

async function globalSetup() {
  console.log('🚀 Starting global setup for ExamApp e2e tests...');
  
  // Add any global setup logic here
  // For example: database seeding, environment setup, etc.
  
  console.log('✅ Global setup completed successfully');
}

module.exports = globalSetup;
