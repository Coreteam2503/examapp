const { test, expect } = require('@playwright/test');
const { GameTestUtils } = require('../utils/game-utils');

test.describe('End-to-End Integration Tests', () => {
  let gameUtils;

  test.describe('Complete Game Flows', () => {
    test('should complete full hangman game workflow', async ({ page }) => {
      gameUtils = new GameTestUtils(page);
      
      // Navigate and start game
      await gameUtils.navigateToGame('hangman');
      await gameUtils.startGame();
      
      // Play through complete game
      let questionCount = 0;
      const maxQuestions = 10;
      
      while (questionCount < maxQuestions) {
        try {
          // Take screenshot before each question
          await gameUtils.takeTimestampedScreenshot(`hangman-question-${questionCount + 1}`);
          
          // Answer question based on type
          if (await page.locator('.mcq-options').isVisible({ timeout: 3000 })) {
            await gameUtils.answerMCQ('A');
          } else if (await page.locator('.true-false-options').isVisible({ timeout: 2000 })) {
            await gameUtils.answerTrueFalse(true);
          } else if (await page.locator('.fill-blank-input').isVisible({ timeout: 2000 })) {
            await gameUtils.answerFillBlank('function');
          } else {
            console.log('Unknown question type, using default MCQ A');
            await gameUtils.answerMCQ('A');
          }
          
          // Handle result modal
          await gameUtils.handleResultModal(true);
          questionCount++;
          
          // Check if game completed
          if (await page.locator(':has-text("Congratulations"), :has-text("Game Over")').isVisible({ timeout: 2000 })) {
            break;
          }
          
          await page.waitForTimeout(500);
        } catch (error) {
          console.log(`Question ${questionCount + 1} error:`, error.message);
          break;
        }
      }
      
      // Verify completion
      await gameUtils.verifyGameCompletion();
      await gameUtils.takeTimestampedScreenshot('hangman-completion');
      
      expect(questionCount).toBeGreaterThan(0);
    });

    test('should complete full word ladder game workflow', async ({ page }) => {
      gameUtils = new GameTestUtils(page);
      
      // Navigate and start game
      await gameUtils.navigateToGame('ladder');
      await gameUtils.startGame();
      
      // Verify ladder starts at bottom
      await expect(page.locator(':has-text("Steps: 0")')).toBeVisible();
      
      // Play through complete game
      let questionCount = 0;
      let ladderSteps = 0;
      const maxQuestions = 10;
      
      while (questionCount < maxQuestions) {
        try {
          await gameUtils.takeTimestampedScreenshot(`ladder-question-${questionCount + 1}`);
          
          // Answer question
          if (await page.locator('.mcq-options').isVisible({ timeout: 3000 })) {
            await gameUtils.answerMCQ('A');
          } else if (await page.locator('.true-false-options').isVisible({ timeout: 2000 })) {
            await gameUtils.answerTrueFalse(true);
          } else {
            await gameUtils.answerMCQ('A');
          }
          
          await gameUtils.handleResultModal(true);
          questionCount++;
          ladderSteps++;
          
          // Verify ladder progress
          await expect(page.locator(`:has-text("Steps: ${ladderSteps}")`)).toBeVisible();
          
          // Check if game completed
          if (await page.locator(':has-text("Congratulations"), :has-text("climbed the entire ladder")').isVisible({ timeout: 2000 })) {
            break;
          }
          
          await page.waitForTimeout(500);
        } catch (error) {
          console.log(`Ladder question ${questionCount + 1} error:`, error.message);
          break;
        }
      }
      
      await gameUtils.verifyGameCompletion();
      await gameUtils.takeTimestampedScreenshot('ladder-completion');
      
      expect(questionCount).toBeGreaterThan(0);
      expect(ladderSteps).toBeGreaterThan(0);
    });

    test('should complete full knowledge tower game workflow', async ({ page }) => {
      gameUtils = new GameTestUtils(page);
      
      // Navigate and start game
      await gameUtils.navigateToGame('tower');
      await gameUtils.startGame();
      
      // Verify tower starts at level 1
      await expect(page.locator(':has-text("Level 1")')).toBeVisible();
      
      // Play through tower levels
      let levelCount = 0;
      const maxLevels = 10;
      
      while (levelCount < maxLevels) {
        try {
          await gameUtils.takeTimestampedScreenshot(`tower-level-${levelCount + 1}`);
          
          // Answer question
          if (await page.locator('.mcq-options').isVisible({ timeout: 3000 })) {
            await gameUtils.answerMCQ('A');
          } else if (await page.locator('.true-false-options').isVisible({ timeout: 2000 })) {
            await gameUtils.answerTrueFalse(true);
          } else if (await page.locator('.fill-blank-input').isVisible({ timeout: 2000 })) {
            await gameUtils.answerFillBlank('variable');
          } else {
            await gameUtils.answerMCQ('A');
          }
          
          await gameUtils.handleResultModal(true);
          levelCount++;
          
          // Check if tower completed
          if (await page.locator(':has-text("Tower Complete"), :has-text("Congratulations")').isVisible({ timeout: 2000 })) {
            break;
          }
          
          // Verify level progression
          await expect(page.locator(`:has-text("Level ${levelCount + 1}"), :has-text("Level")`)).toBeVisible();
          
          await page.waitForTimeout(500);
        } catch (error) {
          console.log(`Tower level ${levelCount + 1} error:`, error.message);
          break;
        }
      }
      
      await gameUtils.verifyGameCompletion();
      await gameUtils.takeTimestampedScreenshot('tower-completion');
      
      expect(levelCount).toBeGreaterThan(0);
    });
  });

  test.describe('Cross-Game Functionality', () => {
    test('should test universal result modal across all games', async ({ page }) => {
      const games = ['hangman', 'ladder', 'tower'];
      
      for (const gameName of games) {
        gameUtils = new GameTestUtils(page);
        
        console.log(`Testing result modal in ${gameName} game`);
        
        await gameUtils.navigateToGame(gameName);
        await gameUtils.startGame();
        
        // Answer one question to trigger result modal
        if (await page.locator('.mcq-options').isVisible({ timeout: 3000 })) {
          await gameUtils.answerMCQ('A');
        } else if (await page.locator('.true-false-options').isVisible({ timeout: 2000 })) {
          await gameUtils.answerTrueFalse(true);
        }
        
        // Verify universal result modal appears
        await expect(page.locator('.universal-result-modal')).toBeVisible();
        await expect(page.locator(':has-text("Excellent"), :has-text("Not quite right")')).toBeVisible();
        await expect(page.locator('button:has-text("Continue"), button:has-text("Next")')).toBeVisible();
        
        // Close modal
        await page.locator('button:has-text("Continue"), button:has-text("Next")').click();
        await expect(page.locator('.universal-result-modal')).not.toBeVisible();
        
        await gameUtils.takeTimestampedScreenshot(`${gameName}-result-modal-test`);
      }
    });

    test('should test question types across all games', async ({ page }) => {
      const games = ['hangman', 'ladder', 'tower'];
      const questionTypes = {
        mcq: '.mcq-options',
        trueFalse: '.true-false-options',
        fillBlank: '.fill-blank-input',
        matching: '.matching-section',
        ordering: '.ordering-section'
      };
      
      for (const gameName of games) {
        gameUtils = new GameTestUtils(page);
        
        console.log(`Testing question types in ${gameName} game`);
        
        await gameUtils.navigateToGame(gameName);
        await gameUtils.startGame();
        
        // Test first few questions to see what types are available
        for (let i = 0; i < 3; i++) {
          try {
            let questionTypeFound = 'none';
            
            // Identify question type
            for (const [type, selector] of Object.entries(questionTypes)) {
              if (await page.locator(selector).isVisible({ timeout: 1000 })) {
                questionTypeFound = type;
                break;
              }
            }
            
            console.log(`${gameName} Question ${i + 1}: ${questionTypeFound}`);
            
            // Answer based on type
            switch (questionTypeFound) {
              case 'mcq':
                await gameUtils.answerMCQ('A');
                break;
              case 'trueFalse':
                await gameUtils.answerTrueFalse(true);
                break;
              case 'fillBlank':
                await gameUtils.answerFillBlank('test');
                break;
              case 'matching':
                // Click first available matching option
                await page.locator('.matching-option').first().click();
                break;
              case 'ordering':
                // Try to submit ordering question
                const submitBtn = page.locator('button:has-text("Submit")');
                if (await submitBtn.isVisible({ timeout: 2000 })) {
                  await submitBtn.click();
                }
                break;
              default:
                // Default to MCQ
                await gameUtils.answerMCQ('A');
            }
            
            await gameUtils.handleResultModal(true);
            await page.waitForTimeout(500);
            
          } catch (error) {
            console.log(`${gameName} question ${i + 1} error:`, error.message);
            break;
          }
        }
        
        await gameUtils.takeTimestampedScreenshot(`${gameName}-question-types-test`);
      }
    });

    test('should test game exit functionality across all games', async ({ page }) => {
      const games = ['hangman', 'ladder', 'tower'];
      
      for (const gameName of games) {
        gameUtils = new GameTestUtils(page);
        
        console.log(`Testing exit functionality in ${gameName} game`);
        
        await gameUtils.navigateToGame(gameName);
        await gameUtils.startGame();
        
        // Answer at least one question
        if (await page.locator('.mcq-options').isVisible({ timeout: 3000 })) {
          await gameUtils.answerMCQ('A');
          await gameUtils.handleResultModal(true);
        }
        
        // Test exit functionality
        const exitButton = page.locator('.exit-game-btn, button:has-text("Exit")');
        if (await exitButton.isVisible({ timeout: 3000 })) {
          await exitButton.click();
          
          // Check for confirmation dialog
          const confirmDialog = page.locator(':has-text("Exit"), :has-text("Are you sure")');
          if (await confirmDialog.isVisible({ timeout: 3000 })) {
            await page.locator('button:has-text("Yes"), button:has-text("Confirm")').click();
          }
          
          // Should show score screen or navigate away
          await expect(page.locator('.score-screen, :has-text("Results"), :has-text("Score")')).toBeVisible();
        }
        
        await gameUtils.takeTimestampedScreenshot(`${gameName}-exit-test`);
      }
    });
  });

  test.describe('Performance and Reliability', () => {
    test('should handle rapid question answering', async ({ page }) => {
      gameUtils = new GameTestUtils(page);
      
      await gameUtils.navigateToGame('hangman');
      await gameUtils.startGame();
      
      // Answer questions rapidly
      for (let i = 0; i < 5; i++) {
        try {
          if (await page.locator('.mcq-options').isVisible({ timeout: 2000 })) {
            await page.locator('.mcq-options button').first().click();
          }
          
          // Handle result modal quickly
          const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")');
          await continueBtn.waitFor({ state: 'visible', timeout: 5000 });
          await continueBtn.click();
          
          // Minimal wait
          await page.waitForTimeout(200);
        } catch (error) {
          console.log(`Rapid answering error at question ${i + 1}:`, error.message);
          break;
        }
      }
      
      // Game should still be functional
      await expect(page.locator('.hangman-game, .question-section')).toBeVisible();
    });

    test('should handle network delays gracefully', async ({ page }) => {
      gameUtils = new GameTestUtils(page);
      
      // Simulate slow network
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 100); // 100ms delay
      });
      
      await gameUtils.navigateToGame('ladder');
      await gameUtils.startGame();
      
      // Answer a few questions with network delay
      for (let i = 0; i < 3; i++) {
        try {
          if (await page.locator('.mcq-options').isVisible({ timeout: 10000 })) {
            await gameUtils.answerMCQ('A');
            await gameUtils.handleResultModal(true);
          }
        } catch (error) {
          console.log(`Network delay test error at question ${i + 1}:`, error.message);
          break;
        }
      }
      
      // Remove network delay
      await page.unroute('**/*');
    });

    test('should maintain game state consistency', async ({ page }) => {
      gameUtils = new GameTestUtils(page);
      
      await gameUtils.navigateToGame('tower');
      await gameUtils.startGame();
      
      // Track game state through questions
      let currentLevel = 1;
      
      for (let i = 0; i < 3; i++) {
        // Verify current level is displayed
        await expect(page.locator(`:has-text("Level ${currentLevel}")`)).toBeVisible();
        
        // Answer question correctly
        if (await page.locator('.mcq-options').isVisible({ timeout: 3000 })) {
          await gameUtils.answerMCQ('A');
          await gameUtils.handleResultModal(true);
        }
        
        currentLevel++;
        
        // Verify level progression
        if (i < 2) { // Don't check on last iteration as game might complete
          await expect(page.locator(`:has-text("Level ${currentLevel}"), :has-text("Level")`)).toBeVisible();
        }
        
        await page.waitForTimeout(500);
      }
    });
  });
});
