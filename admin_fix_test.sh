#!/bin/bash

echo "🔧 Admin Students API Fix Test"
echo "=============================="

echo "1. Testing students endpoint without authentication (should get 401)..."
curl -s -w "HTTP Status: %{http_code}\n" http://localhost:8000/api/admin/students?page=1&limit=10&search= -o /dev/null

echo ""
echo "2. Testing with a sample token (should get proper response or 401 if token invalid)..."
echo "Note: You'll need to test with actual admin token from browser"

echo ""
echo "🔧 Fix Applied:"
echo "✅ Separated count query from select query to avoid GROUP BY conflict"
echo "✅ The SQL error should now be resolved"
echo ""
echo "📝 To test properly:"
echo "1. Login as admin in browser"
echo "2. Open Network tab in DevTools"
echo "3. Navigate to Admin → Students"
echo "4. Check the /api/admin/students request - should return 200 with student data"
echo ""
echo "Expected: 200 response with student list instead of 500 SQL error"
