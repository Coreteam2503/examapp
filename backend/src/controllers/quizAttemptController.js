const { db: knex } = require('../config/database');
const PointsService = require('../services/points/PointsService');

class QuizAttemptController {
  /**
   * Submit a quiz attempt
   * POST /api/quiz-attempts
   */
  async submitAttempt(req, res) {
    try {
      const { quizId, answers, timeElapsed, completedAt, isGameFormat, gameFormat, gameResults } = req.body;
      const userId = req.user.userId;

      if (!quizId || !answers) {
        return res.status(400).json({ error: 'Quiz ID and answers are required' });
      }
      
      console.log('Quiz submission received:', {
        quizId,
        isGameFormat,
        gameFormat,
        answersCount: Object.keys(answers).length,
        hasGameResults: !!gameResults
      });

      // Get quiz information
      const quiz = await knex('quizzes')
        .where({ id: quizId, user_id: userId })
        .first();

      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }

      // Get quiz questions
      const questions = await knex('questions')
        .where('quiz_id', quizId)
        .orderBy('question_number');

      if (questions.length === 0) {
        return res.status(400).json({ error: 'Quiz has no questions' });
      }

      // Calculate score (with game format handling)
      const scoreData = isGameFormat 
        ? this.calculateGameScore(gameResults, gameFormat, questions.length)
        : this.calculateScore(questions, answers);
        
      console.log('Score calculation result:', scoreData);

      // Create attempt record
      const [attemptId] = await knex('attempts').insert({
        user_id: userId,
        quiz_id: quizId,
        started_at: new Date(Date.now() - (timeElapsed * 1000)),
        completed_at: completedAt ? new Date(completedAt) : new Date(),
        time_elapsed: timeElapsed,
        total_questions: scoreData.totalQuestions,
        questions_answered: scoreData.totalAnswered,
        correct_answers: scoreData.correctAnswers,
        score_percentage: scoreData.scorePercentage,
        created_at: new Date()
      });

      // Store individual answers (handle both game and traditional formats)
      const answerRecords = [];
      
      if (isGameFormat) {
        // For game formats, use the transformed answers
        for (const [answerId, answerData] of Object.entries(answers)) {
          // Store game-specific data in user_answer as JSON if needed
          let userAnswerData = answerData.answer;
          if (answerData.gameSpecific) {
            userAnswerData = JSON.stringify({
              answer: answerData.answer,
              gameData: answerData.gameSpecific
            });
          }
          
          answerRecords.push({
            attempt_id: attemptId,
            question_id: answerId,
            user_answer: typeof userAnswerData === 'object' ? JSON.stringify(userAnswerData) : userAnswerData,
            is_correct: answerData.isCorrect || false,
            time_spent: answerData.timeSpent || 0,
            created_at: new Date()
          });
        }
      } else {
        // Traditional quiz format
        for (const question of questions) {
          const userAnswer = answers[question.id];
          if (userAnswer) {
            console.log('Comparing answers:', {
              questionId: question.id,
              userAnswer: userAnswer.answer,
              correctAnswer: question.correct_answer,
              questionType: question.type
            });
            const isCorrect = this.validateAnswer(userAnswer.answer, question);
            console.log(`Answer for question ${question.id}: ${isCorrect ? 'Correct' : 'Incorrect'}`);
            answerRecords.push({
              attempt_id: attemptId,
              question_id: question.id,
              user_answer: typeof userAnswer.answer === 'object' ? JSON.stringify(userAnswer.answer) : userAnswer.answer,
              is_correct: isCorrect,
              time_spent: userAnswer.timeSpent || 0,
              created_at: new Date()
            });
          }
        }
      }

      if (answerRecords.length > 0) {
        await knex('answers').insert(answerRecords);
      }

      // Award points for quiz completion
      try {
        const pointsResult = await PointsService.awardQuizPoints(
          userId, 
          attemptId, 
          scoreData.scorePercentage, 
          questions.length, 
          scoreData.correctAnswers
        );
        console.log(`Awarded ${pointsResult.totalPoints} points to user ${userId} for quiz completion`);
      } catch (pointsError) {
        console.error('Error awarding points:', pointsError);
        // Don't fail the quiz submission if points fail
      }

      // Get complete attempt data to return
      const completeAttempt = await this.getAttemptWithDetails(attemptId);

      res.status(201).json({
        message: 'Quiz attempt submitted successfully',
        attempt: completeAttempt
      });

    } catch (error) {
      console.error('Error submitting quiz attempt:', error);
      res.status(500).json({ 
        error: 'Failed to submit quiz attempt',
        details: error.message 
      });
    }
  }

  /**
   * Get quiz attempt by ID
   * GET /api/quiz-attempts/:id
   */
  async getAttempt(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const attempt = await this.getAttemptWithDetails(id, userId);

      if (!attempt) {
        return res.status(404).json({ error: 'Attempt not found' });
      }

      res.json(attempt);

    } catch (error) {
      console.error('Error fetching attempt:', error);
      res.status(500).json({ error: 'Failed to fetch attempt' });
    }
  }

  /**
   * Get user's quiz attempts history
   * GET /api/quiz-attempts
   */
  async getUserAttempts(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10, quizId } = req.query;
      const offset = (page - 1) * limit;

      let query = knex('attempts')
        .select([
          'attempts.*',
          'quizzes.title as quiz_title',
          'quizzes.difficulty',
          'uploads.filename'
        ])
        .leftJoin('quizzes', 'attempts.quiz_id', 'quizzes.id')
        .leftJoin('uploads', 'quizzes.upload_id', 'uploads.id')
        .where('attempts.user_id', userId);

      if (quizId) {
        query = query.where('attempts.quiz_id', quizId);
      }

      const attempts = await query
        .orderBy('attempts.completed_at', 'desc')
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const totalQuery = knex('attempts').where('user_id', userId);
      if (quizId) {
        totalQuery.where('quiz_id', quizId);
      }
      const totalCount = await totalQuery.count('id as count').first();

      res.json({
        attempts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount.count,
          totalPages: Math.ceil(totalCount.count / limit)
        }
      });

    } catch (error) {
      console.error('Error fetching user attempts:', error);
      res.status(500).json({ error: 'Failed to fetch attempts' });
    }
  }

  /**
   * Get user statistics and analytics
   * GET /api/quiz-attempts/statistics
   */
  async getUserStatistics(req, res) {
    try {
      const userId = req.user.userId;

      // Overall statistics
      const overallStats = await knex('attempts')
        .where('user_id', userId)
        .select([
          knex.raw('COUNT(*) as total_attempts'),
          knex.raw('AVG(score_percentage) as average_score'),
          knex.raw('MAX(score_percentage) as highest_score'),
          knex.raw('MIN(score_percentage) as lowest_score'),
          knex.raw('SUM(time_elapsed) as total_time_spent'),
          knex.raw('AVG(time_elapsed) as average_time_per_quiz')
        ])
        .first();

      // Recent performance (last 10 attempts)
      const recentAttempts = await knex('attempts')
        .select(['score_percentage', 'completed_at', 'quiz_id'])
        .leftJoin('quizzes', 'attempts.quiz_id', 'quizzes.id')
        .select('quizzes.title as quiz_title')
        .where('attempts.user_id', userId)
        .orderBy('completed_at', 'desc')
        .limit(10);

      // Performance by difficulty
      const difficultyStats = await knex('attempts')
        .select([
          'quizzes.difficulty',
          knex.raw('COUNT(*) as attempts_count'),
          knex.raw('AVG(attempts.score_percentage) as average_score'),
          knex.raw('MAX(attempts.score_percentage) as best_score')
        ])
        .leftJoin('quizzes', 'attempts.quiz_id', 'quizzes.id')
        .where('attempts.user_id', userId)
        .groupBy('quizzes.difficulty');

      // Weekly progress (last 4 weeks)
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const weeklyProgress = await knex('attempts')
        .select([
          knex.raw('DATE(completed_at) as date'),
          knex.raw('COUNT(*) as attempts_count'),
          knex.raw('AVG(score_percentage) as average_score')
        ])
        .where('user_id', userId)
        .where('completed_at', '>=', fourWeeksAgo)
        .groupBy(knex.raw('DATE(completed_at)'))
        .orderBy('date');

      // Quiz-specific performance
      const quizPerformance = await knex('attempts')
        .select([
          'quiz_id',
          'quizzes.title as quiz_title',
          'quizzes.difficulty',
          knex.raw('COUNT(*) as attempts_count'),
          knex.raw('AVG(score_percentage) as average_score'),
          knex.raw('MAX(score_percentage) as best_score'),
          knex.raw('MIN(completed_at) as first_attempt'),
          knex.raw('MAX(completed_at) as latest_attempt')
        ])
        .leftJoin('quizzes', 'attempts.quiz_id', 'quizzes.id')
        .where('attempts.user_id', userId)
        .groupBy('quiz_id', 'quizzes.title', 'quizzes.difficulty')
        .orderBy('latest_attempt', 'desc');

      res.json({
        overall: {
          ...overallStats,
          average_score: Math.round(overallStats.average_score || 0),
          total_time_formatted: this.formatTime(overallStats.total_time_spent || 0),
          average_time_formatted: this.formatTime(overallStats.average_time_per_quiz || 0)
        },
        recent_attempts: recentAttempts,
        difficulty_breakdown: difficultyStats,
        weekly_progress: weeklyProgress,
        quiz_performance: quizPerformance
      });

    } catch (error) {
      console.error('Error fetching user statistics:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }

  /**
   * Get detailed quiz results with question-by-question breakdown
   * GET /api/quiz-attempts/:id/detailed
   */
  async getDetailedResults(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      // Get attempt with quiz details
      const attempt = await knex('attempts')
        .select([
          'attempts.*',
          'quizzes.title as quiz_title',
          'quizzes.difficulty',
          'quizzes.total_questions',
          'uploads.filename'
        ])
        .leftJoin('quizzes', 'attempts.quiz_id', 'quizzes.id')
        .leftJoin('uploads', 'quizzes.upload_id', 'uploads.id')
        .where({ 'attempts.id': id, 'attempts.user_id': userId })
        .first();

      if (!attempt) {
        return res.status(404).json({ error: 'Attempt not found' });
      }

      // Get detailed answers with questions
      const answers = await knex('answers')
        .select([
          'answers.*',
          'questions.question_text',
          'questions.options',
          'questions.correct_answer',
          'questions.explanation',
          'questions.concepts',
          'questions.code_snippet',
          'questions.question_number'
        ])
        .leftJoin('questions', 'answers.question_id', 'questions.id')
        .where('answers.attempt_id', id)
        .orderBy('questions.question_number');

      // Format answers for better readability
      const formattedAnswers = answers.map(answer => ({
        ...answer,
        options: answer.options ? JSON.parse(answer.options) : [],
        concepts: answer.concepts ? JSON.parse(answer.concepts) : [],
        is_correct: Boolean(answer.is_correct)
      }));

      // Calculate additional statistics
      const correctAnswers = formattedAnswers.filter(a => a.is_correct).length;
      const totalTimeOnQuestions = formattedAnswers.reduce((sum, a) => sum + (a.time_spent || 0), 0);

      res.json({
        attempt: {
          ...attempt,
          time_formatted: this.formatTime(attempt.time_elapsed),
          average_time_per_question: Math.round(attempt.time_elapsed / attempt.total_questions)
        },
        answers: formattedAnswers,
        summary: {
          total_questions: attempt.total_questions,
          questions_answered: attempt.questions_answered,
          correct_answers: correctAnswers,
          incorrect_answers: attempt.questions_answered - correctAnswers,
          accuracy_rate: Math.round((correctAnswers / attempt.questions_answered) * 100),
          completion_rate: Math.round((attempt.questions_answered / attempt.total_questions) * 100),
          total_time_on_questions: totalTimeOnQuestions,
          average_time_per_question: Math.round(totalTimeOnQuestions / formattedAnswers.length)
        }
      });

    } catch (error) {
      console.error('Error fetching detailed results:', error);
      res.status(500).json({ error: 'Failed to fetch detailed results' });
    }
  }

  /**
   * Get recent quiz attempts for dashboard
   * GET /api/quiz-attempts/recent
   */
  async getRecentAttempts(req, res) {
    try {
      const userId = req.user.userId;
      const { limit = 5 } = req.query;

      const recentAttempts = await knex('attempts')
        .select([
          'attempts.id',
          'attempts.score_percentage as score',
          'attempts.completed_at as completedAt',
          'attempts.time_elapsed as timeSpent',
          'attempts.total_questions as questionCount',
          'quizzes.title',
          'quizzes.difficulty',
          knex.raw('100 as maxScore') // Assuming max score is always 100%
        ])
        .leftJoin('quizzes', 'attempts.quiz_id', 'quizzes.id')
        .where('attempts.user_id', userId)
        .orderBy('attempts.completed_at', 'desc')
        .limit(parseInt(limit));

      // Format the data to match frontend expectations
      const formattedAttempts = recentAttempts.map(attempt => ({
        id: attempt.id,
        title: attempt.title || 'Untitled Quiz',
        questionCount: attempt.questionCount || 0,
        score: Math.round(attempt.score || 0),
        completedAt: attempt.completedAt,
        maxScore: attempt.maxScore,
        timeSpent: Math.round((attempt.timeSpent || 0) / 60), // Convert seconds to minutes
        difficulty: attempt.difficulty || 'medium'
      }));

      res.json(formattedAttempts);

    } catch (error) {
      console.error('Error fetching recent attempts:', error);
      res.status(500).json({ 
        error: 'Failed to fetch recent attempts',
        details: error.message 
      });
    }
  }

  /**
   * Delete a quiz attempt
   * DELETE /api/quiz-attempts/:id
   */
  async deleteAttempt(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      // Verify ownership
      const attempt = await knex('attempts')
        .where({ id, user_id: userId })
        .first();

      if (!attempt) {
        return res.status(404).json({ error: 'Attempt not found' });
      }

      // Delete in transaction
      await knex.transaction(async (trx) => {
        // Delete answers first
        await trx('answers').where('attempt_id', id).del();
        
        // Delete attempt
        await trx('attempts').where('id', id).del();
      });

      res.json({ message: 'Attempt deleted successfully' });

    } catch (error) {
      console.error('Error deleting attempt:', error);
      res.status(500).json({ error: 'Failed to delete attempt' });
    }
  }

  /**
   * Helper method to calculate game score
   */
  calculateGameScore(gameResults, gameFormat, totalQuestions) {
    let correctAnswers = 0;
    let totalAnswered = 0;
    
    console.log('Calculating game score:', { gameResults, gameFormat, totalQuestions });
    
    switch (gameFormat) {
      case 'hangman':
        correctAnswers = gameResults.correctWords || 0;
        totalAnswered = gameResults.totalWordsCompleted || gameResults.totalWords || totalQuestions;
        break;
        
      case 'knowledge_tower':
        correctAnswers = gameResults.correctAnswers || 0;
        totalAnswered = gameResults.totalQuestions || gameResults.totalLevels || totalQuestions;
        break;
        
      default:
        // For other games, use provided score or assume completion
        correctAnswers = gameResults.score ? Math.round((gameResults.score / 100) * totalQuestions) : totalQuestions;
        totalAnswered = totalQuestions;
        break;
    }
    
    const scorePercentage = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
    
    console.log('Game score calculated:', {
      correctAnswers,
      totalAnswered,
      scorePercentage,
      totalQuestions
    });
    
    return {
      correctAnswers,
      totalAnswered,
      scorePercentage,
      totalQuestions
    };
  }
  
  /**
   * Helper method to calculate quiz score
   */
  calculateScore(questions, answers) {
    let correctAnswers = 0;
    let totalAnswered = 0;

    for (const question of questions) {
      const userAnswer = answers[question.id];
      if (userAnswer && userAnswer.answer !== undefined && userAnswer.answer !== null) {
        totalAnswered++;
        if (this.validateAnswer(userAnswer.answer, question)) {
          correctAnswers++;
        }
      }
    }

    const scorePercentage = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;

    return {
      correctAnswers,
      totalAnswered,
      scorePercentage,
      totalQuestions: questions.length
    };
  }

  /**
   * Helper method to get complete attempt data with details
   */
  async getAttemptWithDetails(attemptId, userId = null) {
    let query = knex('attempts')
      .select([
        'attempts.*',
        'quizzes.title as quiz_title',
        'quizzes.difficulty',
        'uploads.filename'
      ])
      .leftJoin('quizzes', 'attempts.quiz_id', 'quizzes.id')
      .leftJoin('uploads', 'quizzes.upload_id', 'uploads.id')
      .where('attempts.id', attemptId);

    if (userId) {
      query = query.where('attempts.user_id', userId);
    }

    const attempt = await query.first();

    if (attempt) {
      // Format time for better readability
      attempt.time_formatted = this.formatTime(attempt.time_elapsed);
    }

    return attempt;
  }

  /**
   * Helper method to format time in seconds to readable format
   */
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Enhanced answer validation with lenient matching for different question types
   */
  validateAnswer(userAnswer, question) {
    if (userAnswer === null || userAnswer === undefined) {
      return false;
    }

    // If correct answer is null, any answer should be considered correct
    if (question.correct_answer === null || question.correct_answer === undefined) {
      return true;
    }

    const questionType = question.type;
    const correctAnswer = question.correct_answer;

    console.log('Validating answer:', {
      questionType,
      userAnswer,
      correctAnswer,
      userAnswerType: typeof userAnswer,
      correctAnswerType: typeof correctAnswer
    });

    switch (questionType) {
      case 'multiple_choice':
        return this.validateMultipleChoice(userAnswer, correctAnswer);
      
      case 'true_false':
      case 'true-false':
        return this.validateTrueFalse(userAnswer, correctAnswer);
      
      case 'fill_in_the_blank':
      case 'fill-in-the-blank':
      case 'fill_blank':
        return this.validateFillInTheBlank(userAnswer, question);
      
      default:
        // Default to exact match for unknown types
        return String(userAnswer).trim() === String(correctAnswer).trim();
    }
  }

  /**
   * Validate multiple choice answers
   */
  validateMultipleChoice(userAnswer, correctAnswer) {
    // Handle both "B) Option text" and "B" formats
    const userLetter = this.extractLetter(userAnswer);
    const correctLetter = this.extractLetter(correctAnswer);
    
    return userLetter === correctLetter;
  }

  /**
   * Validate true/false answers
   */
  validateTrueFalse(userAnswer, correctAnswer) {
    const normalizedUser = this.normalizeTrueFalse(userAnswer);
    const normalizedCorrect = this.normalizeTrueFalse(correctAnswer);
    
    return normalizedUser === normalizedCorrect;
  }

  /**
   * Validate fill-in-the-blank answers with lenient matching
   */
  validateFillInTheBlank(userAnswer, question) {
    // If correct answer is null or empty, accept any answer
    if (!question.correct_answer || question.correct_answer === 'null') {
      return true;
    }

    // Handle object answers (multiple blanks)
    if (typeof userAnswer === 'object' && userAnswer !== null) {
      return this.validateFillBlankObject(userAnswer, question);
    }

    // Handle string answers (single blank)
    if (typeof userAnswer === 'string') {
      return this.validateFillBlankString(userAnswer, question.correct_answer);
    }

    return false;
  }

  /**
   * Validate fill-in-the-blank object answers (multiple blanks)
   */
  validateFillBlankObject(userAnswers, question) {
    try {
      // Try to parse correct answers if it's a string
      let correctAnswers = question.correct_answers_data;
      if (typeof correctAnswers === 'string') {
        correctAnswers = JSON.parse(correctAnswers);
      }

      if (!correctAnswers || typeof correctAnswers !== 'object') {
        // If no correct answers defined, accept any answers
        return true;
      }

      // Check each blank
      let allCorrect = true;
      Object.keys(userAnswers).forEach(blankKey => {
        const userBlankAnswer = userAnswers[blankKey];
        const correctBlankAnswers = correctAnswers[blankKey];

        if (!correctBlankAnswers || correctBlankAnswers.length === 0) {
          // No correct answers for this blank, accept any answer
          return;
        }

        const isBlankCorrect = this.isAnswerInList(userBlankAnswer, correctBlankAnswers);
        if (!isBlankCorrect) {
          allCorrect = false;
        }
      });

      return allCorrect;
    } catch (error) {
      console.error('Error validating fill blank object:', error);
      return false;
    }
  }

  /**
   * Validate fill-in-the-blank string answer (single blank)
   */
  validateFillBlankString(userAnswer, correctAnswer) {
    if (!correctAnswer) {
      return true; // Accept any answer if no correct answer defined
    }

    try {
      // If correct answer is a JSON array, check against all possibilities
      if (correctAnswer.startsWith('[') || correctAnswer.startsWith('{')) {
        const correctAnswers = JSON.parse(correctAnswer);
        if (Array.isArray(correctAnswers)) {
          return this.isAnswerInList(userAnswer, correctAnswers);
        }
      }
    } catch (error) {
      // Not JSON, treat as single string
    }

    // Single string comparison with lenient matching
    return this.isAnswerMatch(userAnswer, correctAnswer);
  }

  /**
   * Check if user answer matches any answer in a list with lenient matching
   */
  isAnswerInList(userAnswer, correctAnswersList) {
    if (!correctAnswersList || correctAnswersList.length === 0) {
      return true; // Accept any answer if no correct answers
    }

    for (const correctAnswer of correctAnswersList) {
      if (this.isAnswerMatch(userAnswer, correctAnswer)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Lenient answer matching for fill-in-the-blank
   */
  isAnswerMatch(userAnswer, correctAnswer) {
    if (!userAnswer || !correctAnswer) {
      return false;
    }

    const userNormalized = String(userAnswer).toLowerCase().trim();
    const correctNormalized = String(correctAnswer).toLowerCase().trim();

    // Exact match
    if (userNormalized === correctNormalized) {
      return true;
    }

    // User answer contains correct answer
    if (userNormalized.includes(correctNormalized)) {
      return true;
    }

    // Correct answer contains user answer (more lenient)
    if (correctNormalized.includes(userNormalized)) {
      return true;
    }

    // Simple similarity for single words
    if (userNormalized.split(' ').length === 1 && correctNormalized.split(' ').length === 1) {
      const similarity = this.calculateSimilarity(userNormalized, correctNormalized);
      return similarity > 0.7; // 70% similarity threshold
    }

    return false;
  }

  /**
   * Calculate simple similarity between two strings
   */
  calculateSimilarity(str1, str2) {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;
    
    const distance = this.levenshteinDistance(str1, str2);
    return (maxLength - distance) / maxLength;
  }

  /**
   * Calculate Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Extract letter from multiple choice option
   */
  extractLetter(option) {
    if (!option || typeof option !== 'string') {
      return option;
    }
    
    // Match patterns like "A)", "B)", "C)", "D)" at the start
    const match = option.match(/^([A-D])\)/);
    if (match) {
      return match[1];
    }
    
    // If already just a letter
    if (/^[A-D]$/.test(option.trim())) {
      return option.trim();
    }
    
    return option;
  }

  /**
   * Normalize true/false values
   */
  normalizeTrueFalse(value) {
    if (typeof value === 'boolean') {
      return value ? 'True' : 'False';
    }
    
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      if (lower === 'true' || lower === '1' || lower === 'yes') {
        return 'True';
      }
      if (lower === 'false' || lower === '0' || lower === 'no') {
        return 'False';
      }
      return value;
    }
    
    if (typeof value === 'number') {
      return value === 1 || value > 0 ? 'True' : 'False';
    }
    
    return value;
  }
}

const quizAttemptController = new QuizAttemptController();

module.exports = {
  submitAttempt: (req, res) => quizAttemptController.submitAttempt(req, res),
  getAttempt: (req, res) => quizAttemptController.getAttempt(req, res),
  getUserAttempts: (req, res) => quizAttemptController.getUserAttempts(req, res),
  getUserStatistics: (req, res) => quizAttemptController.getUserStatistics(req, res),
  getDetailedResults: (req, res) => quizAttemptController.getDetailedResults(req, res),
  getRecentAttempts: (req, res) => quizAttemptController.getRecentAttempts(req, res),
  deleteAttempt: (req, res) => quizAttemptController.deleteAttempt(req, res)
};
