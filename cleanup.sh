#!/bin/bash

# 🧹 ExamApp Cleanup Script - June 19, 2025
# This script removes unnecessary files to optimize the project

echo "🧹 Starting ExamApp Cleanup Process..."
echo "======================================"

# Remove test and debug files created during development
echo "📝 Removing test and debug files..."
rm -f test-quiz-scoring.js
rm -f test-enhancements.js
rm -f test-*.bat
rm -f frontend/debug-localstorage.js
rm -f backend/debug-games.js
rm -f backend/diagnostic.js
rm -f backend/final-test.js
rm -f backend/fix-backend.js
rm -f backend/fix-question-types.js
rm -f backend/quick-fix-questions.js
rm -f backend/test-game-flow.js
rm -f backend/test-games.js
rm -f backend/test-server.js
rm -f backend/restart_trigger.js

# Remove old empty backup directory
echo "📁 Removing empty backup directories..."
rmdir "BACKUP_\$(date)" 2>/dev/null || true

# Remove OS generated files
echo "🖥️ Removing OS generated files..."
find . -name ".DS_Store" -delete 2>/dev/null || true
find . -name "Thumbs.db" -delete 2>/dev/null || true
find . -name "desktop.ini" -delete 2>/dev/null || true
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name "*~" -delete 2>/dev/null || true

# Remove log files
echo "📋 Removing log files..."
find . -name "*.log" -delete 2>/dev/null || true
find . -name "npm-debug.log*" -delete 2>/dev/null || true
find . -name "yarn-debug.log*" -delete 2>/dev/null || true
find . -name "yarn-error.log*" -delete 2>/dev/null || true

echo "✅ Cleanup completed!"
echo ""
echo "📊 Cleanup Summary:"
echo "- Removed test and debug files"
echo "- Cleaned OS generated files" 
echo "- Removed log files"
echo "- Preserved all critical project files"
echo ""
echo "💡 To complete cleanup:"
echo "1. Delete node_modules: rm -rf frontend/node_modules backend/node_modules"
echo "2. Reinstall dependencies: npm install in both frontend and backend"
echo "3. Verify project still works after cleanup"
