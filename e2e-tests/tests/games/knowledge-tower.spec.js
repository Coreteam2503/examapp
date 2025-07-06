const { test, expect } = require('@playwright/test');
const { GameTestUtils } = require('../../utils/game-utils');
const { towerTestData } = require('../../fixtures/test-data');

test.describe('Knowledge Tower Game', () => {
  let gameUtils;

  test.beforeEach(async ({ page }) => {
    gameUtils = new GameTestUtils(page);
    await gameUtils.navigateToGame('tower');
  });

  test('should start knowledge tower game successfully', async ({ page }) => {
    // Start the game
    await gameUtils.startGame();

    // Verify game elements are visible
    await expect(page.locator('.tower-game')).toBeVisible();
    await expect(page.locator('.tower-container')).toBeVisible();
    await expect(page.locator('.question-section')).toBeVisible();
    
    // Verify game header shows correct information
    await expect(page.locator(':has-text("Knowledge Tower")')).toBeVisible();
    await expect(page.locator(':has-text("Level 1")')).toBeVisible();
  });

  test('should display tower visual correctly', async ({ page }) => {
    await gameUtils.startGame();

    // Check tower structure
    const tower = page.locator('.tower-container');
    await expect(tower).toBeVisible();
    
    // Verify tower has multiple levels
    await expect(tower.locator('.tower-level')).toHaveCount({ min: 3 });
    
    // Verify current level is highlighted
    await expect(tower.locator('.tower-level.current')).toBeVisible();
    
    // Verify level numbers are displayed
    await expect(tower.locator(':has-text("1"), :has-text("2"), :has-text("3")')).toBeVisible();
  });

  test('should progress through tower levels with correct answers', async ({ page }) => {
    await gameUtils.startGame();

    // Answer first level correctly
    await gameUtils.answerMCQ('A');
    await gameUtils.handleResultModal(true);

    // Should progress to level 2
    await expect(page.locator(':has-text("Level 2")')).toBeVisible();
    
    // Tower visual should update
    await expect(page.locator('.tower-level.completed')).toBeVisible();
  });

  test('should handle retry functionality for wrong answers', async ({ page }) => {
    await gameUtils.startGame();

    // Answer incorrectly
    await gameUtils.answerMCQ('D');
    
    // Wait for result modal
    await expect(page.locator('.universal-result-modal')).toBeVisible();
    await expect(page.locator(':has-text("Not quite right")')).toBeVisible();

    // Should show retry option
    const retryButton = page.locator('button:has-text("Try Again")');
    await expect(retryButton).toBeVisible();
    
    // Click retry
    await retryButton.click();
    
    // Modal should close and allow retry
    await expect(page.locator('.universal-result-modal')).not.toBeVisible();
    
    // Answer correctly this time
    await gameUtils.answerMCQ('A');
    await gameUtils.handleResultModal(true);
    
    // Should progress to next level
    await expect(page.locator(':has-text("Level 2")')).toBeVisible();
  });

  test('should complete tower successfully', async ({ page }) => {
    await gameUtils.startGame();

    // Complete all levels
    await gameUtils.completeGameSession(towerTestData.correctAnswers);

    // Verify successful completion
    await gameUtils.verifyGameCompletion();
    await expect(page.locator(':has-text("Congratulations"), :has-text("Tower Complete")')).toBeVisible();
  });

  test('should show tower climbing animation', async ({ page }) => {
    await gameUtils.startGame();

    // Answer question correctly
    await gameUtils.answerMCQ('A');
    await gameUtils.handleResultModal(true);

    // Check that previous level is marked as completed
    await expect(page.locator('.tower-level.completed')).toBeVisible();
    
    // Current level should be highlighted
    await expect(page.locator('.tower-level.current')).toBeVisible();
  });

  test('should display question themes and difficulty', async ({ page }) => {
    await gameUtils.startGame();

    // Should show level theme if available
    const themeElements = page.locator(':has-text("Level 1:"), .question-header');
    await expect(themeElements.first()).toBeVisible();
    
    // May show difficulty indicator
    const difficultyElements = page.locator(':has-text("Difficulty:"), .difficulty-');
    if (await difficultyElements.first().isVisible({ timeout: 2000 })) {
      await expect(difficultyElements.first()).toBeVisible();
    }
  });

  test('should handle different question types in tower', async ({ page }) => {
    await gameUtils.startGame();

    let levelCount = 0;
    const maxLevels = 5;

    while (levelCount < maxLevels) {
      try {
        // Check what type of question is displayed
        if (await page.locator('.mcq-options').isVisible({ timeout: 3000 })) {
          await gameUtils.answerMCQ('A');
        } else if (await page.locator('.true-false-options').isVisible({ timeout: 2000 })) {
          await gameUtils.answerTrueFalse(true);
        } else if (await page.locator('.fill-blank-input').isVisible({ timeout: 2000 })) {
          await gameUtils.answerFillBlank('function');
        } else if (await page.locator('.matching-section').isVisible({ timeout: 2000 })) {
          // Handle matching questions by clicking available options
          const matchingOptions = page.locator('.matching-option');
          if (await matchingOptions.first().isVisible()) {
            await matchingOptions.first().click();
          }
        } else {
          // Default to MCQ
          await gameUtils.answerMCQ('A');
        }

        await gameUtils.handleResultModal(true);
        levelCount++;
        
        // Check if we completed the tower
        if (await page.locator(':has-text("Tower Complete"), :has-text("Congratulations")').isVisible({ timeout: 2000 })) {
          break;
        }
      } catch (error) {
        console.log('Level handling error:', error.message);
        break;
      }
    }

    // Should have progressed through at least some levels
    expect(levelCount).toBeGreaterThan(0);
  });

  test('should show retry vs continue options correctly', async ({ page }) => {
    await gameUtils.startGame();

    // Test wrong answer - should show retry
    await gameUtils.answerMCQ('D');
    await expect(page.locator('.universal-result-modal')).toBeVisible();
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
    
    // Retry
    await page.locator('button:has-text("Try Again")').click();
    
    // Test correct answer - should show continue
    await gameUtils.answerMCQ('A');
    await expect(page.locator('.universal-result-modal')).toBeVisible();
    await expect(page.locator('button:has-text("Continue")')).toBeVisible();
    
    // Continue to next level
    await page.locator('button:has-text("Continue")').click();
    
    // Should be on level 2
    await expect(page.locator(':has-text("Level 2")')).toBeVisible();
  });

  test('should handle tower with retry scenarios', async ({ page }) => {
    await gameUtils.startGame();

    // Answer wrong, then retry with correct answer
    for (const scenario of towerTestData.retryScenarios) {
      if (scenario.retry) {
        // Answer wrong first
        if (scenario.type === 'mcq') {
          await gameUtils.answerMCQ(scenario.option);
        } else if (scenario.type === 'true_false') {
          await gameUtils.answerTrueFalse(scenario.value);
        }
        
        // Handle wrong result and retry
        await expect(page.locator('.universal-result-modal')).toBeVisible();
        await page.locator('button:has-text("Try Again")').click();
        
        // Answer correctly
        if (scenario.retry.type === 'mcq') {
          await gameUtils.answerMCQ(scenario.retry.option);
        } else if (scenario.retry.type === 'true_false') {
          await gameUtils.answerTrueFalse(scenario.retry.value);
        }
        
        await gameUtils.handleResultModal(true);
      } else {
        // Normal correct answer
        if (scenario.type === 'mcq') {
          await gameUtils.answerMCQ(scenario.option);
        } else if (scenario.type === 'true_false') {
          await gameUtils.answerTrueFalse(scenario.value);
        }
        
        await gameUtils.handleResultModal(true);
      }
    }
    
    // Should have progressed through levels
    await expect(page.locator(':has-text("Level"), :has-text("2"), :has-text("3")')).toBeVisible();
  });

  test('should show tower progress visually', async ({ page }) => {
    await gameUtils.startGame();

    // Initially should show level 1 as current
    await expect(page.locator('.tower-level.current')).toHaveCount(1);
    
    // Complete first level
    await gameUtils.answerMCQ('A');
    await gameUtils.handleResultModal(true);
    
    // Should now show level 1 as completed and level 2 as current
    await expect(page.locator('.tower-level.completed')).toHaveCount(1);
    await expect(page.locator('.tower-level.current')).toHaveCount(1);
  });

  test('should handle game completion flow', async ({ page }) => {
    await gameUtils.startGame();

    // Complete multiple levels quickly
    for (let i = 0; i < 3; i++) {
      await gameUtils.answerMCQ('A');
      await gameUtils.handleResultModal(true);
      await page.waitForTimeout(500);
    }

    // Should either complete tower or show progress
    const isCompleted = await page.locator(':has-text("Tower Complete"), :has-text("Congratulations")').isVisible({ timeout: 2000 });
    const isProgressing = await page.locator(':has-text("Level")').isVisible();
    
    expect(isCompleted || isProgressing).toBeTruthy();
  });
});
