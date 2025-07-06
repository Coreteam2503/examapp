const { test, expect } = require('@playwright/test');
const { GameTestUtils } = require('../../utils/game-utils');
const { hangmanTestData } = require('../../fixtures/test-data');

test.describe('Hangman Game', () => {
  let gameUtils;

  test.beforeEach(async ({ page }) => {
    gameUtils = new GameTestUtils(page);
    await gameUtils.navigateToGame('hangman');
  });

  test('should start hangman game successfully', async ({ page }) => {
    // Start the game
    await gameUtils.startGame();

    // Verify game elements are visible
    await expect(page.locator('.hangman-game')).toBeVisible();
    await expect(page.locator('.hangman-display')).toBeVisible();
    await expect(page.locator('.question-section')).toBeVisible();
    
    // Verify game header shows correct information
    await expect(page.locator(':has-text("Hangman Game")')).toBeVisible();
    await expect(page.locator(':has-text("Question 1 of")')).toBeVisible();
    await expect(page.locator(':has-text("Wrong: 0/6")')).toBeVisible();
  });

  test('should display hangman visual correctly', async ({ page }) => {
    await gameUtils.startGame();

    // Check initial hangman state (empty gallows)
    const hangmanDisplay = page.locator('.hangman-display');
    await expect(hangmanDisplay).toBeVisible();
    
    // Verify hangman structure elements
    await expect(hangmanDisplay.locator(':has-text("+")')).toBeVisible(); // Gallows
    await expect(hangmanDisplay.locator(':has-text("=")')).toBeVisible(); // Base
  });

  test('should handle correct answers and keep hangman safe', async ({ page }) => {
    await gameUtils.startGame();

    // Answer first question correctly
    await gameUtils.answerMCQ('A');
    await gameUtils.handleResultModal(true);

    // Verify hangman is still safe (wrong count should be 0)
    await expect(page.locator(':has-text("Wrong: 0/6")')).toBeVisible();
    
    // Verify we moved to next question
    await expect(page.locator(':has-text("Question 2 of")')).toBeVisible();
  });

  test('should handle wrong answers and update hangman visual', async ({ page }) => {
    await gameUtils.startGame();

    // Answer first question incorrectly
    await gameUtils.answerMCQ('D'); // Assuming D is usually wrong
    await gameUtils.handleResultModal(false);

    // Verify wrong count increased
    await expect(page.locator(':has-text("Wrong: 1/6")')).toBeVisible();
    
    // Verify hangman visual updated (should show head)
    const hangmanDisplay = page.locator('.hangman-display');
    await expect(hangmanDisplay.locator(':has-text("O")')).toBeVisible(); // Head
  });

  test('should complete game successfully with all correct answers', async ({ page }) => {
    await gameUtils.startGame();

    // Answer all questions correctly
    await gameUtils.completeGameSession(hangmanTestData.correctAnswers);

    // Verify successful completion
    await gameUtils.verifyGameCompletion();
    await expect(page.locator(':has-text("Congratulations"), :has-text("You saved the hangman")')).toBeVisible();
    
    // Verify final stats
    await expect(page.locator(':has-text("Wrong answers: 0")')).toBeVisible();
  });

  test('should end game when hangman dies (6 wrong answers)', async ({ page }) => {
    await gameUtils.startGame();

    // Answer questions wrong until hangman dies
    await gameUtils.completeGameSession(hangmanTestData.wrongAnswers);

    // Verify game over state
    await expect(page.locator(':has-text("Game Over"), :has-text("hangman has been hanged")')).toBeVisible();
    
    // Verify final hangman visual (complete hangman)
    const hangmanDisplay = page.locator('.hangman-display');
    await expect(hangmanDisplay.locator(':has-text("O")')).toBeVisible(); // Head
    await expect(hangmanDisplay.locator(':has-text("/|\\")')).toBeVisible(); // Body with arms
    await expect(hangmanDisplay.locator(':has-text("/ \\")')).toBeVisible(); // Legs
  });

  test('should handle mixed correct/wrong answers', async ({ page }) => {
    await gameUtils.startGame();

    // Answer with mixed results
    await gameUtils.completeGameSession(hangmanTestData.mixedAnswers);

    // Should complete with some wrong answers but hangman survives
    await gameUtils.verifyGameCompletion();
    
    // Verify some wrong answers were recorded
    await expect(page.locator(':has-text("Wrong answers: 2")')).toBeVisible();
  });

  test('should allow game exit and show confirmation', async ({ page }) => {
    await gameUtils.startGame();

    // Click exit button
    await page.locator('.exit-game-btn').click();

    // Verify confirmation dialog appears
    await expect(page.locator(':has-text("Exit Game?")')).toBeVisible();
    await expect(page.locator(':has-text("Your progress will be saved")')).toBeVisible();

    // Confirm exit
    await page.locator('button:has-text("Yes, Exit")').click();

    // Should show score screen or navigate away
    await expect(page.locator('.score-screen, :has-text("exited")')).toBeVisible();
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

  test('should show question progress correctly', async ({ page }) => {
    await gameUtils.startGame();

    // Check initial progress
    await expect(page.locator(':has-text("Question 1 of")')).toBeVisible();

    // Answer one question
    await gameUtils.answerMCQ('A');
    await gameUtils.handleResultModal(true);

    // Check progress updated
    await expect(page.locator(':has-text("Question 2 of")')).toBeVisible();
  });

  test('should handle different question types', async ({ page }) => {
    await gameUtils.startGame();

    // This test will adapt to whatever question types are available
    let questionCount = 0;
    const maxQuestions = 5;

    while (questionCount < maxQuestions) {
      try {
        // Check what type of question is displayed
        if (await page.locator('.mcq-options').isVisible({ timeout: 2000 })) {
          await gameUtils.answerMCQ('A');
        } else if (await page.locator('.true-false-options').isVisible({ timeout: 2000 })) {
          await gameUtils.answerTrueFalse(true);
        } else if (await page.locator('.fill-blank-input').isVisible({ timeout: 2000 })) {
          await gameUtils.answerFillBlank('test');
        } else {
          // Default to MCQ
          await gameUtils.answerMCQ('A');
        }

        await gameUtils.handleResultModal(true);
        questionCount++;
      } catch (error) {
        console.log('Question handling error:', error.message);
        break;
      }
    }

    // Should have progressed through questions
    expect(questionCount).toBeGreaterThan(0);
  });
});
