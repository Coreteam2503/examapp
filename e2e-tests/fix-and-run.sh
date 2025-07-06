#!/bin/bash

# Quick Fix Script for E2E Testing

echo "🔧 ExamApp E2E Testing - Quick Fix"
echo "================================="

# Check current directory
if [[ ! -f "playwright.config.js" ]]; then
    echo "❌ Error: You're not in the e2e-tests directory!"
    echo ""
    echo "📁 Current directory: $(pwd)"
    echo ""
    echo "🔄 Please run these commands:"
    echo "   cd examapp_jayati_latest/e2e-tests"
    echo "   ./quick-test.sh smoke"
    echo ""
    echo "Or run this from anywhere:"
    echo "   cd examapp_jayati_latest/e2e-tests && ./quick-test.sh smoke"
    exit 1
fi

echo "✅ Correct directory detected"
echo "📁 Location: $(pwd)"
echo ""

# Check if Playwright is installed locally
if [[ ! -d "node_modules" ]]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if browsers are installed
if [[ ! -d "node_modules/@playwright" ]]; then
    echo "🌐 Installing Playwright browsers..."
    npx playwright install
fi

echo ""
echo "🚀 Running smoke test..."
echo "========================"

# Run the smoke test
npx playwright test tests/games/hangman.spec.js --grep "should start hangman game successfully" --project=chromium --reporter=list

echo ""
echo "✅ Test completed!"
echo ""
echo "📊 To see detailed results:"
echo "   ./quick-test.sh report"
echo ""
echo "🎯 Other useful commands:"
echo "   ./quick-test.sh bugs      # Show recent failures"
echo "   ./quick-test.sh all       # Run all tests"
echo "   ./quick-test.sh clean     # Clean test results"
