#!/bin/bash

echo "🔍 User Batches 403 Error Debug"
echo "==============================="

echo "1. Testing current user endpoint..."
curl -s http://localhost:8000/api/users/me -H "Authorization: Bearer YOUR_TOKEN_HERE" || echo "Need to test with actual token from browser"

echo ""
echo "2. Testing user batches endpoint..."
curl -s http://localhost:8000/api/users/2/batches -H "Authorization: Bearer YOUR_TOKEN_HERE" || echo "Need to test with actual token from browser"

echo ""
echo "🔧 Fix Applied:"
echo "✅ Added debug logging to getUserBatches method"
echo "✅ Fixed user ID comparison (userId vs id field)"
echo "✅ Added /users/me debug endpoint"
echo ""
echo "📝 To test properly:"
echo "1. Open browser DevTools → Network tab"
echo "2. Login to the app"
echo "3. Go to Dashboard tab"
echo "4. Check the Authorization header from a successful request"
echo "5. Check backend console logs for debugging info"
echo ""
echo "Expected fix: The authorization logic now handles both userId and id fields correctly"
