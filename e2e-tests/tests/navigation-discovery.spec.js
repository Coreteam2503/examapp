const { test, expect } = require('@playwright/test');
const { GameTestUtils } = require('../utils/game-utils');

test.describe('Navigation Discovery', () => {
  test('should explore available navigation options', async ({ page }) => {
    const gameUtils = new GameTestUtils(page);
    
    // Navigate to the app and login
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await gameUtils.handleLogin();
    
    // Take screenshot of main page
    await page.screenshot({ path: 'main-dashboard.png', fullPage: true });
    
    // Look for navigation elements
    console.log('🔍 Looking for navigation elements...');
    
    // Check for game links or buttons
    const gameElements = await page.locator('a, button, [href], [onclick]').all();
    for (let i = 0; i < Math.min(gameElements.length, 20); i++) {
      const element = gameElements[i];
      const text = await element.textContent();
      const href = await element.getAttribute('href');
      const className = await element.getAttribute('class');
      
      if (text && text.length > 0) {
        console.log(`Element ${i}: "${text}" - href: ${href} - class: ${className}`);
      }
    }
    
    // Look specifically for hangman-related elements
    const hangmanElements = page.locator(':has-text("hangman"), :has-text("Hangman")');
    const hangmanCount = await hangmanElements.count();
    console.log(`Found ${hangmanCount} hangman-related elements`);
    
    // Look for game-related text
    const gameText = page.locator(':has-text("game"), :has-text("Game"), :has-text("challenge"), :has-text("Challenge")');
    const gameCount = await gameText.count();
    console.log(`Found ${gameCount} game-related elements`);
    
    await page.waitForTimeout(2000);
  });
});
