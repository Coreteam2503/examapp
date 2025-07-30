require('dotenv').config();

console.log('🔍 Environment Variables Debug:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'undefined');

const knexConfig = require('./knexfile.js');
console.log('\n📋 Knex Configuration:');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Config:', JSON.stringify(knexConfig.development.connection, null, 2));
