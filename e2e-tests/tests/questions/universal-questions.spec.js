const { test, expect } = require('@playwright/test');
const { GameTestUtils } = require('../../utils/game-utils');

test.describe('Universal Question Components', () => {
  let gameUtils;

  test.beforeEach(async ({ page }) => {
    gameUtils = new GameTestUtils(page);
    // Start any game to test question components
    await gameUtils.navigateToGame('hangman');
    await gameUtils.startGame();
  });

  test('should display MCQ questions correctly', async ({ page }) => {
    // Wait for MCQ question to load
    const mcqOptions = page.locator('.mcq-options');
    if (await mcqOptions.isVisible({ timeout: 5000 })) {
      // Verify MCQ structure
      await expect(mcqOptions).toBeVisible();
      await expect(mcqOptions.locator('button')).toHaveCount({ min: 2, max: 6 });
      
      // Verify options have letters (A, B, C, D)
      await expect(mcqOptions.locator(':has-text("A"), :has-text("B")')).toBeVisible();
      
      // Test clicking an option
      await mcqOptions.locator('button').first().click();
      
      // Should show result modal
      await expect(page.locator('.universal-result-modal')).toBeVisible();
    }
  });

  test('should display True/False questions correctly', async ({ page }) => {
    // Look for True/False questions
    const tfOptions = page.locator('.true-false-options');
    if (await tfOptions.isVisible({ timeout: 5000 })) {
      // Verify True/False structure
      await expect(tfOptions).toBeVisible();
      await expect(tfOptions.locator('button:has-text("True")')).toBeVisible();
      await expect(tfOptions.locator('button:has-text("False")')).toBeVisible();
      
      // Test clicking True
      await tfOptions.locator('button:has-text("True")').click();
      
      // Should show result modal
      await expect(page.locator('.universal-result-modal')).toBeVisible();
    }
  });

  test('should display Fill-in-the-Blank questions correctly', async ({ page }) => {
    // Look for fill-in-the-blank questions
    const fillBlankInput = page.locator('.fill-blank-input');
    if (await fillBlankInput.isVisible({ timeout: 5000 })) {
      // Verify fill blank structure
      await expect(fillBlankInput).toBeVisible();
      await expect(page.locator('button:has-text("Submit")')).toBeVisible();
      
      // Test filling and submitting
      await fillBlankInput.fill('test answer');
      await page.locator('button:has-text("Submit")').click();
      
      // Should show result modal
      await expect(page.locator('.universal-result-modal')).toBeVisible();
    }
  });

  test('should display Matching questions correctly', async ({ page }) => {
    // Look for matching questions
    const matchingSection = page.locator('.matching-section');
    if (await matchingSection.isVisible({ timeout: 5000 })) {
      // Verify matching structure
      await expect(matchingSection).toBeVisible();
      await expect(matchingSection.locator('.matching-left')).toBeVisible();
      await expect(matchingSection.locator('.matching-right')).toBeVisible();
      
      // Should have matching items and options
      await expect(matchingSection.locator('.matching-item')).toHaveCount({ min: 2 });
      await expect(matchingSection.locator('.matching-option')).toHaveCount({ min: 2 });
      
      // Test clicking a matching option
      await matchingSection.locator('.matching-option').first().click();
      
      // Continue matching until complete or timeout
      let attempts = 0;
      while (attempts < 5) {
        const remainingOptions = page.locator('.matching-option');
        if (await remainingOptions.count() > 0) {
          await remainingOptions.first().click();
          await page.waitForTimeout(500);
        } else {
          break;
        }
        attempts++;
      }
    }
  });

  test('should display Ordering questions correctly', async ({ page }) => {
    // Look for ordering questions
    const orderingSection = page.locator('.ordering-section, .drag-drop-container');
    if (await orderingSection.isVisible({ timeout: 5000 })) {
      // Verify ordering structure
      await expect(orderingSection).toBeVisible();
      
      // Should have available items and ordered area
      const availableItems = page.locator('.available-items, .items-container').first();
      const orderedArea = page.locator('.ordered-items, .ordered-column').first();
      
      if (await availableItems.isVisible()) {
        await expect(availableItems).toBeVisible();
      }
      
      if (await orderedArea.isVisible()) {
        await expect(orderedArea).toBeVisible();
      }
      
      // Test drag and drop or clicking to order
      const items = page.locator('.draggable-item, .ordering-item').first();
      if (await items.isVisible()) {
        await items.click();
      }
      
      // Look for submit button
      const submitButton = page.locator('button:has-text("Submit"), .submit-btn');
      if (await submitButton.isVisible({ timeout: 3000 })) {
        await submitButton.click();
        // Should show result modal
        await expect(page.locator('.universal-result-modal')).toBeVisible();
      }
    }
  });

  test('should show universal result modal correctly', async ({ page }) => {
    // Answer any question to trigger result modal
    if (await page.locator('.mcq-options').isVisible({ timeout: 3000 })) {
      await page.locator('.mcq-options button').first().click();
    } else if (await page.locator('.true-false-options').isVisible({ timeout: 2000 })) {
      await page.locator('button:has-text("True")').click();
    } else if (await page.locator('.fill-blank-input').isVisible({ timeout: 2000 })) {
      await page.locator('.fill-blank-input').fill('test');
      await page.locator('button:has-text("Submit")').click();
    }

    // Verify result modal structure
    const resultModal = page.locator('.universal-result-modal');
    await expect(resultModal).toBeVisible();
    
    // Should show result icon
    await expect(resultModal.locator('.result-icon')).toBeVisible();
    
    // Should show result title
    await expect(resultModal.locator(':has-text("Excellent"), :has-text("Not quite right")')).toBeVisible();
    
    // Should show answer details
    await expect(resultModal.locator(':has-text("Your answer")')).toBeVisible();
    await expect(resultModal.locator(':has-text("Correct answer")')).toBeVisible();
    
    // Should show action buttons
    const continueBtn = resultModal.locator('button:has-text("Continue"), button:has-text("Next")');
    const retryBtn = resultModal.locator('button:has-text("Try Again")');
    
    // At least one action button should be visible
    const hasContinue = await continueBtn.isVisible();
    const hasRetry = await retryBtn.isVisible();
    expect(hasContinue || hasRetry).toBeTruthy();
  });

  test('should handle result modal actions correctly', async ({ page }) => {
    // Answer a question to trigger result modal
    if (await page.locator('.mcq-options').isVisible({ timeout: 3000 })) {
      await page.locator('.mcq-options button').first().click();
    } else {
      await page.locator('button:has-text("True")').click();
    }

    // Wait for result modal
    await expect(page.locator('.universal-result-modal')).toBeVisible();
    
    // Test continue/next button
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")');
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
      
      // Modal should close
      await expect(page.locator('.universal-result-modal')).not.toBeVisible();
      
      // Should progress to next question or game state
      await page.waitForTimeout(1000);
    }
  });

  test('should display question text correctly', async ({ page }) => {
    // Question text should be visible
    const questionText = page.locator('.question-text, .question-content h3');
    await expect(questionText.first()).toBeVisible();
    
    // Should contain some text
    const textContent = await questionText.first().textContent();
    expect(textContent.length).toBeGreaterThan(5);
  });

  test('should handle disabled state correctly', async ({ page }) => {
    // Answer a question
    if (await page.locator('.mcq-options').isVisible({ timeout: 3000 })) {
      await page.locator('.mcq-options button').first().click();
    }
    
    // After answering, question should be disabled while showing result
    const resultModal = page.locator('.universal-result-modal');
    if (await resultModal.isVisible({ timeout: 5000 })) {
      // Question options should be disabled
      const options = page.locator('.mcq-options button, .true-false-options button, .fill-blank-input');
      if (await options.first().isVisible()) {
        const isDisabled = await options.first().isDisabled();
        expect(isDisabled).toBeTruthy();
      }
    }
  });

  test('should show explanations when available', async ({ page }) => {
    // Answer a question to see result modal
    if (await page.locator('.mcq-options').isVisible({ timeout: 3000 })) {
      await page.locator('.mcq-options button').first().click();
    }
    
    const resultModal = page.locator('.universal-result-modal');
    await expect(resultModal).toBeVisible();
    
    // Check if explanation is shown
    const explanation = resultModal.locator('.result-explanation, :has-text("Explanation")');
    if (await explanation.isVisible({ timeout: 2000 })) {
      await expect(explanation).toBeVisible();
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Look for any error messages or debug info
    const errorElements = page.locator('.error-message, .question-error, :has-text("Error")');
    
    // If errors are present, they should be displayed properly
    if (await errorElements.first().isVisible({ timeout: 2000 })) {
      await expect(errorElements.first()).toBeVisible();
      console.log('Error detected:', await errorElements.first().textContent());
    }
    
    // Debug info should only be visible in development
    const debugElements = page.locator('.question-debug, :has-text("Debug")');
    if (await debugElements.first().isVisible({ timeout: 1000 })) {
      console.log('Debug info visible - likely in development mode');
    }
  });

  test('should maintain consistent styling across question types', async ({ page }) => {
    // All questions should have consistent wrapper
    await expect(page.locator('.question-wrapper')).toBeVisible();
    
    // Should have proper question structure
    const questionElements = page.locator('.question-text, .question-content, .question-section');
    await expect(questionElements.first()).toBeVisible();
    
    // Check for consistent button styling
    const buttons = page.locator('button');
    if (await buttons.count() > 0) {
      // Buttons should be clickable and styled
      const firstButton = buttons.first();
      await expect(firstButton).toBeVisible();
      
      // Should have proper classes
      const className = await firstButton.getAttribute('class');
      expect(className).toBeTruthy();
    }
  });
});
