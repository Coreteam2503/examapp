const rateLimit = require('express-rate-limit');

// Rate limiting configuration from environment variables
const GENERAL_RATE_LIMIT = parseInt(process.env.GENERAL_RATE_LIMIT_PER_HOUR) || 1000;
const QUIZ_GENERATION_RATE_LIMIT = parseInt(process.env.QUIZ_GENERATION_RATE_LIMIT_PER_HOUR) || 5;
const AUTH_RATE_LIMIT = parseInt(process.env.AUTH_RATE_LIMIT_PER_HOUR) || 50;

console.log('🔒 Rate Limiting Configuration:');
console.log(`   - General API: ${GENERAL_RATE_LIMIT} requests/hour`);
console.log(`   - Quiz Generation: ${QUIZ_GENERATION_RATE_LIMIT} requests/hour`);
console.log(`   - Authentication: ${AUTH_RATE_LIMIT} requests/hour`);

// General API rate limiter - High limit for regular operations
const generalApiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: GENERAL_RATE_LIMIT, // Configurable limit per hour
  message: {
    success: false,
    message: `Too many requests. Maximum ${GENERAL_RATE_LIMIT} requests per hour allowed.`
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    return req.user ? `user_${req.user.userId}` : `ip_${req.ip}`;
  }
});

// Authentication rate limiter - Moderate limit for login/register
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: AUTH_RATE_LIMIT, // Configurable limit for auth operations
  message: {
    success: false,
    message: `Too many authentication attempts. Maximum ${AUTH_RATE_LIMIT} attempts per hour allowed.`
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit auth by IP to prevent abuse
    return `auth_${req.ip}`;
  }
});

// Quiz generation rate limiter - Low limit for expensive AI operations
const quizGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: QUIZ_GENERATION_RATE_LIMIT, // Low limit for expensive operations
  message: {
    success: false,
    message: `Quiz generation limit exceeded. Maximum ${QUIZ_GENERATION_RATE_LIMIT} quiz generations per hour allowed.`,
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit quiz generation by user ID
    const key = req.user ? `quiz_gen_${req.user.userId}` : `quiz_gen_ip_${req.ip}`;
    console.log(`🤖 Quiz generation rate limit check for: ${key}`);
    return key;
  },
  onLimitReached: (req, res, options) => {
    const key = req.user ? `user_${req.user.userId}` : `ip_${req.ip}`;
    console.log(`⚠️  Quiz generation rate limit EXCEEDED for: ${key}`);
  }
});

// Strict limiter for sensitive operations
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Very low limit
  message: {
    success: false,
    message: 'Too many requests for this operation. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generalApiLimiter,
  authLimiter,
  quizGenerationLimiter,
  strictLimiter
};
