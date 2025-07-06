#!/bin/bash

# ExamApp E2E Testing Setup Script

echo "🚀 Setting up ExamApp E2E Testing Suite..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "🌐 Installing Playwright browsers..."
npm run install-browsers

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Playwright browsers"
    exit 1
fi

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start your frontend server: cd ../frontend && npm start"
echo "2. Run tests: npm test"
echo "3. View results in browser: npm run report"
echo ""
echo "🎯 Quick test commands:"
echo "  npm run test:hangman    # Test Hangman game"
echo "  npm run test:ladder     # Test Word Ladder game"
echo "  npm run test:tower      # Test Knowledge Tower game"
echo "  npm run test:headed     # Run with visible browser"
echo "  npm run test:debug      # Debug mode"
