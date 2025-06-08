/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Clear existing entries
  await knex('user_achievements').del();
  await knex('achievements').del();

  // Insert default achievements
  const achievements = [
    // First Time Achievements
    {
      name: 'first_quiz',
      display_name: 'First Steps',
      description: 'Complete your first quiz',
      icon: '🎯',
      category: 'quiz',
      points_reward: 20,
      requirements: JSON.stringify({ quizzes_completed: 1 })
    },
    {
      name: 'first_perfect',
      display_name: 'Perfect Start',
      description: 'Get 100% on your first quiz',
      icon: '⭐',
      category: 'accuracy',
      points_reward: 50,
      requirements: JSON.stringify({ perfect_quizzes: 1 })
    },

    // Quiz Completion Achievements
    {
      name: 'quiz_master_5',
      display_name: 'Quiz Explorer',
      description: 'Complete 5 quizzes',
      icon: '📚',
      category: 'quiz',
      points_reward: 30,
      requirements: JSON.stringify({ quizzes_completed: 5 })
    },
    {
      name: 'quiz_master_10',
      display_name: 'Quiz Enthusiast',
      description: 'Complete 10 quizzes',
      icon: '📖',
      category: 'quiz',
      points_reward: 50,
      requirements: JSON.stringify({ quizzes_completed: 10 })
    },
    {
      name: 'quiz_master_25',
      display_name: 'Quiz Addict',
      description: 'Complete 25 quizzes',
      icon: '🎓',
      category: 'quiz',
      points_reward: 100,
      requirements: JSON.stringify({ quizzes_completed: 25 })
    },
    {
      name: 'quiz_master_50',
      display_name: 'Quiz Legend',
      description: 'Complete 50 quizzes',
      icon: '👑',
      category: 'quiz',
      points_reward: 200,
      requirements: JSON.stringify({ quizzes_completed: 50 })
    },

    // Accuracy Achievements
    {
      name: 'accuracy_80',
      display_name: 'Sharp Shooter',
      description: 'Maintain 80%+ average accuracy',
      icon: '🎯',
      category: 'accuracy',
      points_reward: 75,
      requirements: JSON.stringify({ average_accuracy: 80, min_quizzes: 5 })
    },
    {
      name: 'accuracy_90',
      display_name: 'Precision Master',
      description: 'Maintain 90%+ average accuracy',
      icon: '🏹',
      category: 'accuracy',
      points_reward: 150,
      requirements: JSON.stringify({ average_accuracy: 90, min_quizzes: 5 })
    },
    {
      name: 'perfect_streak_3',
      display_name: 'Hat Trick',
      description: 'Get 100% on 3 consecutive quizzes',
      icon: '🔥',
      category: 'accuracy',
      points_reward: 100,
      requirements: JSON.stringify({ perfect_streak: 3 })
    },
    {
      name: 'perfect_streak_5',
      display_name: 'Unstoppable',
      description: 'Get 100% on 5 consecutive quizzes',
      icon: '💫',
      category: 'accuracy',
      points_reward: 200,
      requirements: JSON.stringify({ perfect_streak: 5 })
    },

    // Streak Achievements
    {
      name: 'streak_3',
      display_name: 'Getting Started',
      description: 'Complete quizzes on 3 consecutive days',
      icon: '📅',
      category: 'streak',
      points_reward: 40,
      requirements: JSON.stringify({ daily_streak: 3 })
    },
    {
      name: 'streak_7',
      display_name: 'Week Warrior',
      description: 'Complete quizzes for 7 consecutive days',
      icon: '🗓️',
      category: 'streak',
      points_reward: 100,
      requirements: JSON.stringify({ daily_streak: 7 })
    },
    {
      name: 'streak_14',
      display_name: 'Fortnight Fighter',
      description: 'Complete quizzes for 14 consecutive days',
      icon: '🏆',
      category: 'streak',
      points_reward: 250,
      requirements: JSON.stringify({ daily_streak: 14 })
    },
    {
      name: 'streak_30',
      display_name: 'Monthly Master',
      description: 'Complete quizzes for 30 consecutive days',
      icon: '👑',
      category: 'streak',
      points_reward: 500,
      requirements: JSON.stringify({ daily_streak: 30 })
    },

    // Points Achievements
    {
      name: 'points_100',
      display_name: 'Century Club',
      description: 'Earn 100 total points',
      icon: '💯',
      category: 'points',
      points_reward: 25,
      requirements: JSON.stringify({ total_points: 100 })
    },
    {
      name: 'points_500',
      display_name: 'Point Collector',
      description: 'Earn 500 total points',
      icon: '💰',
      category: 'points',
      points_reward: 50,
      requirements: JSON.stringify({ total_points: 500 })
    },
    {
      name: 'points_1000',
      display_name: 'Point Master',
      description: 'Earn 1,000 total points',
      icon: '💎',
      category: 'points',
      points_reward: 100,
      requirements: JSON.stringify({ total_points: 1000 })
    },
    {
      name: 'points_5000',
      display_name: 'Point Legend',
      description: 'Earn 5,000 total points',
      icon: '🌟',
      category: 'points',
      points_reward: 250,
      requirements: JSON.stringify({ total_points: 5000 })
    },

    // Level Achievements
    {
      name: 'level_5',
      display_name: 'Rising Star',
      description: 'Reach level 5',
      icon: '⭐',
      category: 'level',
      points_reward: 75,
      requirements: JSON.stringify({ level: 5 })
    },
    {
      name: 'level_10',
      display_name: 'Expert',
      description: 'Reach level 10',
      icon: '🏅',
      category: 'level',
      points_reward: 200,
      requirements: JSON.stringify({ level: 10 })
    },

    // Speed Achievements
    {
      name: 'speed_demon',
      display_name: 'Speed Demon',
      description: 'Complete a quiz in under 2 minutes',
      icon: '⚡',
      category: 'speed',
      points_reward: 50,
      requirements: JSON.stringify({ quiz_time_under: 120 })
    },
    {
      name: 'lightning_fast',
      display_name: 'Lightning Fast',
      description: 'Complete a quiz in under 1 minute',
      icon: '⚡⚡',
      category: 'speed',
      points_reward: 100,
      requirements: JSON.stringify({ quiz_time_under: 60 })
    },

    // Special Achievements
    {
      name: 'night_owl',
      display_name: 'Night Owl',
      description: 'Complete a quiz between 11 PM and 5 AM',
      icon: '🦉',
      category: 'special',
      points_reward: 30,
      requirements: JSON.stringify({ night_quiz: true })
    },
    {
      name: 'early_bird',
      display_name: 'Early Bird',
      description: 'Complete a quiz between 5 AM and 8 AM',
      icon: '🐦',
      category: 'special',
      points_reward: 30,
      requirements: JSON.stringify({ early_quiz: true })
    },
    {
      name: 'weekend_warrior',
      display_name: 'Weekend Warrior',
      description: 'Complete 5 quizzes on weekends',
      icon: '🛡️',
      category: 'special',
      points_reward: 60,
      requirements: JSON.stringify({ weekend_quizzes: 5 })
    }
  ];

  await knex('achievements').insert(achievements);
};
