@echo off

REM ExamApp E2E Testing Setup Script for Windows

echo 🚀 Setting up ExamApp E2E Testing Suite...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo 📦 Installing dependencies...
npm install

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo 🌐 Installing Playwright browsers...
npm run install-browsers

if errorlevel 1 (
    echo ❌ Failed to install Playwright browsers
    pause
    exit /b 1
)

echo ✅ Setup complete!
echo.
echo 📋 Next steps:
echo 1. Start your frontend server: cd ../frontend && npm start
echo 2. Run tests: npm test
echo 3. View results in browser: npm run report
echo.
echo 🎯 Quick test commands:
echo   npm run test:hangman    # Test Hangman game
echo   npm run test:ladder     # Test Word Ladder game
echo   npm run test:tower      # Test Knowledge Tower game
echo   npm run test:headed     # Run with visible browser
echo   npm run test:debug      # Debug mode

pause
