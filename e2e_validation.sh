#!/bin/bash

echo "🧪 E2E Validation Test for Batch Management System"
echo "================================================="

# Test 1: Check if frontend is running
echo "1. Testing Frontend Availability..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running on port 3000"
else
    echo "❌ Frontend is not running on port 3000"
fi

# Test 2: Check if backend is running
echo "2. Testing Backend Availability..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend is running on port 8000"
else
    echo "❌ Backend is not running on port 8000"
fi

# Test 3: Check batch endpoints
echo "3. Testing Batch API Endpoints..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/batches | grep -q "200\|401"; then
    echo "✅ Batch API endpoint is responding"
else
    echo "❌ Batch API endpoint is not responding"
fi

# Test 4: Check if our new files exist
echo "4. Testing New Component Files..."
FILES=(
    "/Users/balajiv/Documents/coderepos/futureOS/examapp_jayati_latest/frontend/src/components/common/BatchSelector.jsx"
    "/Users/balajiv/Documents/coderepos/futureOS/examapp_jayati_latest/frontend/src/components/common/BatchSelector.css"
    "/Users/balajiv/Documents/coderepos/futureOS/examapp_jayati_latest/frontend/src/components/dashboard/StudentDashboard.jsx"
    "/Users/balajiv/Documents/coderepos/futureOS/examapp_jayati_latest/frontend/src/components/dashboard/StudentDashboard.css"
)

for file in "${FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $(basename "$file") exists"
    else
        echo "❌ $(basename "$file") missing"
    fi
done

echo ""
echo "🎯 Next Steps for Manual Testing:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Login as a student user"
echo "3. Check the new 'Dashboard' tab (should be first for students)"
echo "4. Test batch filtering in the dashboard"
echo "5. Test batch selection in quiz generation"
echo "6. Verify batch display in 'My Batches' tab"

echo ""
echo "📝 Key Features to Test:"
echo "- Batch filtering in student dashboard"
echo "- Reusable BatchSelector component"
echo "- Enhanced quiz generation with batch selection"
echo "- Batch-specific performance statistics"
echo "- Navigation between dashboard tabs"
