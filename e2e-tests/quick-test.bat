@echo off
REM Quick Test Runner for ExamApp E2E Tests (Windows)

echo 🎯 ExamApp E2E Test Runner
echo ==========================

if "%1"=="hangman" goto hangman
if "%1"=="h" goto hangman
if "%1"=="ladder" goto ladder
if "%1"=="l" goto ladder
if "%1"=="tower" goto tower
if "%1"=="t" goto tower
if "%1"=="questions" goto questions
if "%1"=="q" goto questions
if "%1"=="integration" goto integration
if "%1"=="i" goto integration
if "%1"=="all" goto all
if "%1"=="a" goto all
if "%1"=="smoke" goto smoke
if "%1"=="s" goto smoke
if "%1"=="report" goto report
if "%1"=="r" goto report
if "%1"=="bugs" goto bugs
if "%1"=="b" goto bugs
if "%1"=="clean" goto clean
if "%1"=="c" goto clean
goto help

:hangman
echo 🚀 Running: Hangman Game Tests
echo ================================
npx playwright test tests/games/hangman.spec.js --project=chromium --reporter=list
goto end

:ladder
echo 🚀 Running: Word Ladder Game Tests
echo ===================================
npx playwright test tests/games/word-ladder.spec.js --project=chromium --reporter=list
goto end

:tower
echo 🚀 Running: Knowledge Tower Game Tests
echo ======================================
npx playwright test tests/games/knowledge-tower.spec.js --project=chromium --reporter=list
goto end

:questions
echo 🚀 Running: Question Component Tests
echo ====================================
npx playwright test tests/questions/universal-questions.spec.js --project=chromium --reporter=list
goto end

:integration
echo 🚀 Running: Integration Tests
echo =============================
npx playwright test tests/integration.spec.js --project=chromium --reporter=list
goto end

:all
echo 🚀 Running All Tests
echo ===================
npx playwright test --reporter=html
if exist "playwright-report\index.html" (
    start playwright-report\index.html
)
goto end

:smoke
echo 💨 Running Quick Smoke Test
echo ============================
npx playwright test tests/games/hangman.spec.js --grep "should start hangman game successfully" --project=chromium --reporter=list
goto end

:report
echo 📊 Opening Test Report...
if exist "playwright-report\index.html" (
    start playwright-report\index.html
) else (
    echo No report found. Run tests first.
)
goto end

:bugs
echo 🐛 Recent Test Failures:
echo ========================
if exist "test-results" (
    dir test-results\*-chromium /B /AD 2>nul | findstr "." >nul
    if errorlevel 1 (
        echo No recent failures found.
    ) else (
        echo Check test-results folder for failure screenshots and videos
        dir test-results\*-chromium /B /AD | head -5
    )
) else (
    echo No test results found. Run tests first.
)
goto end

:clean
echo 🧹 Cleaning test results...
if exist "test-results" rmdir /s /q test-results
if exist "playwright-report" rmdir /s /q playwright-report
echo ✅ Cleaned
goto end

:help
echo Usage: %0 [option]
echo.
echo Game Tests:
echo   hangman, h    - Test Hangman game
echo   ladder, l     - Test Word Ladder game
echo   tower, t      - Test Knowledge Tower game
echo.
echo Component Tests:
echo   questions, q  - Test Universal Question components
echo   integration, i- Test end-to-end integration
echo.
echo Utilities:
echo   all, a        - Run all tests with HTML report
echo   smoke, s      - Quick smoke test
echo   report, r     - Open test report
echo   bugs, b       - Show recent failures
echo   clean, c      - Clean test results
echo.
echo Examples:
echo   %0 hangman    # Test hangman game
echo   %0 smoke      # Quick test
echo   %0 bugs       # See failures
echo   %0 all        # Full test suite

:end
pause
