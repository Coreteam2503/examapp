// Rate limiting is disabled
module.exports = {
  generalApiLimiter: (req, res, next) => next(),
  authLimiter: (req, res, next) => next(),
  quizGenerationLimiter: (req, res, next) => next(),
  strictLimiter: (req, res, next) => next()
};
