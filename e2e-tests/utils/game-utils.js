/**
 * Common utilities for game testing
 */

class GameTestUtils {
  constructor(page) {
    this.page = page;
    this.credentials = {
      email: 'balu.in.u@gmail.com',
      password: '123123'
    };
  }

  /**
   * Handle login if login page is detected
   */
  async handleLogin() {
    // Check if we're on the login page using more specific selector
    const loginForm = this.page.locator('h2.login-title, h2:has-text("Sign in to your account")').first();
    if (await loginForm.isVisible({ timeout: 3000 })) {
      console.log('🔐 Login page detected, authenticating...');
      
      // Fill email
      const emailInput = this.page.locator('input[type="email"], input[placeholder*="email"]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 5000 });
      await emailInput.fill(this.credentials.email);
      
      // Fill password
      const passwordInput = this.page.locator('input[type="password"], input[placeholder*="password"]').first();
      await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
      await passwordInput.fill(this.credentials.password);
      
      // Click sign in button
      const signInButton = this.page.locator('button:has-text("Sign in"), button[type="submit"]').first();
      await signInButton.waitFor({ state: 'visible', timeout: 5000 });
      await signInButton.click();
      
      // Wait for login to complete
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(2000);
      
      console.log('✅ Login completed');
    }
  }

  /**
   * Navigate to a specific game
   * @param {string} gameName - Name of the game (hangman, ladder, tower)
   */
  async navigateToGame(gameName) {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
    
    // Handle login if needed
    await this.handleLogin();
    
    // The games are in quiz cards on the dashboard
    console.log(`🎯 Looking for ${gameName} game...`);
    
    // Scroll down to see all available games
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);
    
    // Look for game cards with specific game names
    const gameNameMap = {
      'hangman': ['hangman', 'Hangman', 'HANGMAN'],
      'ladder': ['ladder', 'Ladder', 'Word Ladder', 'LADDER'],
      'tower': ['tower', 'Tower', 'Knowledge Tower', 'TOWER']
    };
    
    const searchTerms = gameNameMap[gameName] || [gameName];
    let gameButton = null;
    
    for (const term of searchTerms) {
      // Look for any "Play Game" button near text containing the game name
      const playButtons = this.page.locator('button:has-text("Play Game"), .start-quiz-btn');
      const count = await playButtons.count();
      
      for (let i = 0; i < count; i++) {
        const button = playButtons.nth(i);
        const parentCard = button.locator('xpath=ancestor::*[contains(@class, "card") or contains(@class, "quiz")][1]');
        
        if (await parentCard.isVisible({ timeout: 1000 })) {
          const cardText = await parentCard.textContent();
          if (cardText && cardText.toLowerCase().includes(term.toLowerCase())) {
            gameButton = button;
            console.log(`✅ Found ${gameName} game with term: ${term}`);
            break;
          }
        }
      }
      
      if (gameButton) break;
    }
    
    if (gameButton) {
      await gameButton.click();
      console.log(`🎮 Clicked play button for ${gameName}`);
    } else {
      // Fallback: try any "Play Game" button (might work for any game)
      console.log(`⚠️  ${gameName} game not found, trying any available game...`);
      const anyPlayButton = this.page.locator('button:has-text("Play Game"), .start-quiz-btn').first();
      
      if (await anyPlayButton.isVisible({ timeout: 3000 })) {
        await anyPlayButton.click();
        console.log('🎮 Clicked any available play button');
      } else {
        throw new Error(`Could not find ${gameName} game or any play buttons`);
      }
    }
    
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
  }

  /**
   * Start a game by clicking the start button
   */
  async startGame() {
    // More flexible start button detection
    const startSelectors = [
      'button:has-text("Start")',
      'button:has-text("Begin")', 
      'button:has-text("Start Coding Challenge")',
      'button:has-text("Start Game")',
      '.start-game-btn',
      'button[class*="start"]',
      ':has-text("Start") >> button'
    ];
    
    let startButton = null;
    
    for (const selector of startSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          startButton = element;
          console.log(`✅ Found start button with selector: ${selector}`);
          break;
        }
      } catch (error) {
        // Continue trying other selectors
      }
    }
    
    if (startButton) {
      await startButton.click();
      await this.page.waitForTimeout(1000); // Wait for game to initialize
      console.log('🎮 Game started successfully');
    } else {
      // If no start button found, check if game is already started
      const gameElements = [
        '.hangman-game',
        '.word-ladder-container', 
        '.tower-game',
        '.question-section',
        '.game-header'
      ];
      
      let gameStarted = false;
      for (const selector of gameElements) {
        if (await this.page.locator(selector).isVisible({ timeout: 2000 })) {
          gameStarted = true;
          console.log('🎮 Game already appears to be started');
          break;
        }
      }
      
      if (!gameStarted) {
        throw new Error('Could not find start button or detect that game is already started');
      }
    }
  }

  /**
   * Answer an MCQ question
   * @param {string} optionLetter - Letter of the option to select (A, B, C, D)
   */
  async answerMCQ(optionLetter) {
    const option = this.page.locator(`button:has-text("${optionLetter})"), .option-btn:has-text("${optionLetter}")`, `.mcq-option[data-option="${optionLetter}"]`).first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click();
  }

  /**
   * Answer a True/False question
   * @param {boolean} answer - true for True, false for False
   */
  async answerTrueFalse(answer) {
    const buttonText = answer ? 'True' : 'False';
    const button = this.page.locator(`button:has-text("${buttonText}"), .tf-btn:has-text("${buttonText}")`).first();
    await button.waitFor({ state: 'visible', timeout: 10000 });
    await button.click();
  }

  /**
   * Answer a fill-in-the-blank question
   * @param {string} answer - The answer to type
   */
  async answerFillBlank(answer) {
    const input = this.page.locator('input[type="text"], .fill-blank-input').first();
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill(answer);
    
    const submitButton = this.page.locator('button:has-text("Submit"), .submit-btn').first();
    await submitButton.click();
  }

  /**
   * Wait for and handle result modal
   * @param {boolean} expectCorrect - Whether we expect the answer to be correct
   */
  async handleResultModal(expectCorrect = true) {
    // Wait for result modal to appear
    const resultModal = this.page.locator('.universal-result-modal, .result-modal');
    await resultModal.waitFor({ state: 'visible', timeout: 15000 });

    // Verify the result
    if (expectCorrect) {
      await this.page.locator(':has-text("Excellent"), :has-text("Correct")').waitFor({ state: 'visible' });
    } else {
      await this.page.locator(':has-text("Not quite right"), :has-text("Wrong")').waitFor({ state: 'visible' });
    }

    // Click continue button
    const continueButton = this.page.locator('button:has-text("Continue"), button:has-text("Next"), .continue-btn').first();
    await continueButton.waitFor({ state: 'visible', timeout: 5000 });
    await continueButton.click();

    // Wait for modal to disappear
    await resultModal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Complete a game session by answering all questions
   * @param {Array} answers - Array of answers for each question
   */
  async completeGameSession(answers) {
    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      
      console.log(`Answering question ${i + 1}: ${JSON.stringify(answer)}`);
      
      // Wait for question to load
      await this.page.waitForTimeout(1000);
      
      // Answer based on question type
      if (answer.type === 'mcq') {
        await this.answerMCQ(answer.option);
      } else if (answer.type === 'true_false') {
        await this.answerTrueFalse(answer.value);
      } else if (answer.type === 'fill_blank') {
        await this.answerFillBlank(answer.text);
      }
      
      // Handle result modal
      await this.handleResultModal(answer.isCorrect);
      
      // Wait a bit before next question
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Check if game has completed successfully
   */
  async verifyGameCompletion() {
    // Look for completion indicators
    const completionIndicators = [
      ':has-text("Congratulations")',
      ':has-text("Game Complete")',
      ':has-text("Well Done")',
      '.score-screen',
      '.game-complete',
      '.final-score'
    ];

    let found = false;
    for (const indicator of completionIndicators) {
      try {
        await this.page.locator(indicator).waitFor({ state: 'visible', timeout: 5000 });
        found = true;
        break;
      } catch (e) {
        // Continue trying other indicators
      }
    }

    if (!found) {
      throw new Error('Game completion not detected');
    }
  }

  /**
   * Take a screenshot with timestamp
   * @param {string} name - Name for the screenshot
   */
  async takeTimestampedScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  /**
   * Exit game safely
   */
  async exitGame() {
    const exitButton = this.page.locator('button:has-text("Exit"), .exit-game-btn, button:has-text("Done")').first();
    if (await exitButton.isVisible()) {
      await exitButton.click();
      
      // Handle confirmation dialog if it appears
      const confirmButton = this.page.locator('button:has-text("Yes"), button:has-text("Confirm"), .confirm-btn').first();
      if (await confirmButton.isVisible({ timeout: 3000 })) {
        await confirmButton.click();
      }
    }
  }
}

module.exports = { GameTestUtils };
