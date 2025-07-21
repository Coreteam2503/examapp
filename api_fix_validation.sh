#!/bin/bash

echo "🧪 API Service Fix Validation"
echo "============================="

# Test batch endpoints
echo "1. Testing batch API endpoints..."
curl -s -o /dev/null -w "Batches endpoint: %{http_code}\n" http://localhost:8000/api/batches

# Test quiz attempts endpoint
echo "2. Testing quiz attempts API endpoints..."
curl -s -o /dev/null -w "Quiz attempts endpoint: %{http_code}\n" http://localhost:8000/api/quiz-attempts/recent

# Test user batches endpoint
echo "3. Testing user batches API endpoints..."
curl -s -o /dev/null -w "User batches endpoint: %{http_code}\n" http://localhost:8000/api/users/1/batches

echo ""
echo "📝 Expected Results:"
echo "- 200: Endpoint working correctly"
echo "- 401: Authentication required (normal for protected endpoints)"
echo "- 404: Endpoint doesn't exist (needs backend implementation)"
echo ""
echo "🔧 Fixes Applied:"
echo "✅ Changed batchService.js to use 'api' instead of 'apiService'"
echo "✅ Added missing quizAttempts endpoints to apiService"
echo "✅ Added batch endpoints to apiService"
echo "✅ Switched back to full StudentDashboard component"
echo ""
echo "🚀 Ready for testing!"
echo "Refresh your browser and check the Dashboard tab."
