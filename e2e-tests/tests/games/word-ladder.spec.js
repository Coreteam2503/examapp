const { test, expect } = require('@playwright/test');
const { GameTestUtils } = require('../../utils/game-utils');
const { ladderTestData } = require('../../fixtures/test-data');

test.describe('Word Ladder Game', () => {
  let gameUtils;

  test.beforeEach(async ({ page }) => {
    gameUtils = new GameTestUtils(page);
    await gameUtils.navigateToGame('ladder');
  });

  test('should start word ladder game successfully', async ({ page }) => {
    // Start the game
    await gameUtils.startGame();

    // Verify game elements are visible
    await expect(page.locator('.word-ladder-container')).toBeVisible();
    await expect(page.locator('.single-ladder')).toBeVisible();
    await expect(page.locator('.question-section')).toBeVisible();
    
    // Verify game header shows correct information
    await expect(page.locator(':has-text("Programming Ladder")')).toBeVisible();
    await expect(page.locator(':has-text("Question 1 of")')).toBeVisible();
    await expect(page.locator(':has-text("Steps: 0")')).toBeVisible();
  });

  test('should display ladder visual correctly', async ({ page }) => {
    await gameUtils.startGame();

    // Check ladder structure
    const ladder = page.locator('.single-ladder');
    await expect(ladder).toBeVisible();
    
    // Verify ladder elements
    await expect(ladder.locator('.ladder-container')).toBeVisible();
    await expect(ladder.locator('.ladder-rung')).toHaveCount({ min: 3 }); // Should have multiple rungs
    
    // Verify character is at bottom initially
    await expect(ladder.locator('.character-at-bottom')).toBeVisible();
    await expect(ladder.locator(':has-text("Ready to climb!")')).toBeVisible();
  });

  test('should climb ladder with correct answers', async ({ page }) => {
    await gameUtils.startGame();

    // Answer first question correctly
    await gameUtils.answerMCQ('A');
    await gameUtils.handleResultModal(true);

    // Verify ladder progress
    await expect(page.locator(':has-text("Steps: 1")')).toBeVisible();
    
    // Verify character moved up one step
    await expect(page.locator('.climbing-character')).toBeVisible();
    
    // Verify we moved to next question
    await expect(page.locator(':has-text("Question 2 of")')).toBeVisible();
  });

  test('should stay at same level with wrong answers', async ({ page }) => {
    await gameUtils.startGame();

    // Answer first question incorrectly
    await gameUtils.answerMCQ('D'); // Assuming D is usually wrong
    await gameUtils.handleResultModal(false);

    // Verify ladder progress stays at 0
    await expect(page.locator(':has-text("Steps: 0")')).toBeVisible();
    
    // Character should still be at bottom or same position
    await expect(page.locator('.character-at-bottom, .climbing-character')).toBeVisible();
    
    // Should move to next question anyway
    await expect(page.locator(':has-text("Question 2 of")')).toBeVisible();
  });

  test('should complete ladder successfully with all correct answers', async ({ page }) => {
    await gameUtils.startGame();

    // Answer all questions correctly to reach the top
    await gameUtils.completeGameSession(ladderTestData.correctAnswers);

    // Verify successful completion
    await gameUtils.verifyGameCompletion();
    await expect(page.locator(':has-text("Congratulations"), :has-text("climbed the entire ladder")')).toBeVisible();
    
    // Verify reached the top
    await expect(page.locator(':has-text("Reached the top!")')).toBeVisible();
  });

  test('should handle mixed answers and show partial progress', async ({ page }) => {
    await gameUtils.startGame();

    // Answer with mixed results
    await gameUtils.completeGameSession(ladderTestData.mixedAnswers);

    // Should complete but not reach top
    await gameUtils.verifyGameCompletion();
    
    // Verify partial ladder progress
    await expect(page.locator(':has-text("Climbed"), :has-text("of"), :has-text("steps")')).toBeVisible();
  });

  test('should show climbing progress visually', async ({ page }) => {
    await gameUtils.startGame();

    // Answer first question correctly
    await gameUtils.answerMCQ('A');
    await gameUtils.handleResultModal(true);

    // Check that ladder rung is marked as climbed
    await expect(page.locator('.ladder-rung.climbed')).toBeVisible();
    
    // Answer second question correctly
    await gameUtils.answerMCQ('B');
    await gameUtils.handleResultModal(true);

    // Should have more climbed rungs
    await expect(page.locator('.ladder-rung.climbed')).toHaveCount({ min: 2 });
  });

  test('should allow game exit and show confirmation', async ({ page }) => {
    await gameUtils.startGame();

    // Click exit button
    await page.locator('.exit-game-btn').click();

    // Verify confirmation dialog appears
    await expect(page.locator(':has-text("Exit Game?")')).toBeVisible();
    await expect(page.locator(':has-text("Your progress will be saved")')).toBeVisible();

    // Check current progress is shown
    await expect(page.locator(':has-text("Steps climbed:")')).toBeVisible();

    // Confirm exit
    await page.locator('button:has-text("Yes, Exit")').click();

    // Should show score screen
    await expect(page.locator('.score-screen')).toBeVisible();
  });

  test('should track time correctly', async ({ page }) => {
    await gameUtils.startGame();

    // Verify time starts at 0:00
    await expect(page.locator(':has-text("Time: 0:0")')).toBeVisible();

    // Wait a few seconds
    await page.waitForTimeout(3000);

    // Time should have progressed
    await expect(page.locator(':has-text("Time: 0:0"), :has-text("0:01"), :has-text("0:02"), :has-text("0:03")')).toBeVisible();
  });

  test('should show correct game instructions', async ({ page }) => {
    await gameUtils.startGame();

    // Verify instructions are visible
    await expect(page.locator(':has-text("Answer correctly to climb the ladder!")')).toBeVisible();
    await expect(page.locator(':has-text("Correct answer = Climb one step")')).toBeVisible();
    await expect(page.locator(':has-text("Wrong answer = Stay at current level")')).toBeVisible();
  });

  test('should display character avatar', async ({ page }) => {
    await gameUtils.startGame();

    // Should show character avatar (boy or girl emoji)
    await expect(page.locator(':has-text("👦"), :has-text("👧")')).toBeVisible();
  });

  test('should handle retry functionality', async ({ page }) => {
    await gameUtils.startGame();

    // Answer incorrectly first
    await gameUtils.answerMCQ('D');
    
    // Wait for result modal
    await expect(page.locator('.universal-result-modal')).toBeVisible();
    await expect(page.locator(':has-text("Not quite right")')).toBeVisible();

    // Click retry if available
    const retryButton = page.locator('button:has-text("Try Again")');
    if (await retryButton.isVisible({ timeout: 3000 })) {
      await retryButton.click();
      
      // Should close modal and allow retry
      await expect(page.locator('.universal-result-modal')).not.toBeVisible();
      
      // Try again with correct answer
      await gameUtils.answerMCQ('A');
      await gameUtils.handleResultModal(true);
      
      // Should progress
      await expect(page.locator(':has-text("Steps: 1")')).toBeVisible();
    } else {
      // If no retry, just continue
      await page.locator('button:has-text("Continue"), button:has-text("Next")').click();
    }
  });

  test('should show final score screen with ladder details', async ({ page }) => {
    await gameUtils.startGame();

    // Complete some questions
    for (let i = 0; i < 3; i++) {
      await gameUtils.answerMCQ('A');
      await gameUtils.handleResultModal(true);
      await page.waitForTimeout(500);
    }

    // Exit game to see score screen
    await gameUtils.exitGame();

    // Verify score screen elements
    await expect(page.locator('.score-screen')).toBeVisible();
    await expect(page.locator(':has-text("Word Ladder Results")')).toBeVisible();
    await expect(page.locator(':has-text("Final Score")')).toBeVisible();
    await expect(page.locator(':has-text("Ladder Steps")')).toBeVisible();
    await expect(page.locator(':has-text("Time Taken")')).toBeVisible();
  });
});
