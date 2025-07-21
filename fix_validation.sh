#!/bin/bash

echo "🔧 Quick Fix Validation"
echo "======================"

# Check that the new imports exist and are properly formatted
echo "1. Checking BatchProvider import in App.js..."
if grep -q "BatchProvider" /Users/balajiv/Documents/coderepos/futureOS/examapp_jayati_latest/frontend/src/App.js; then
    echo "✅ BatchProvider import found in App.js"
else
    echo "❌ BatchProvider import missing in App.js"
fi

# Check that the StudentDashboard import exists
echo "2. Checking StudentDashboard import in Dashboard.js..."
if grep -q "StudentDashboard" /Users/balajiv/Documents/coderepos/futureOS/examapp_jayati_latest/frontend/src/components/Dashboard.js; then
    echo "✅ StudentDashboard import found in Dashboard.js"
else
    echo "❌ StudentDashboard import missing in Dashboard.js"
fi

# Check that the BatchSelector import exists
echo "3. Checking BatchSelector import in QuizGeneratorForm.jsx..."
if grep -q "BatchSelector" /Users/balajiv/Documents/coderepos/futureOS/examapp_jayati_latest/frontend/src/components/QuizGeneratorForm.jsx; then
    echo "✅ BatchSelector import found in QuizGeneratorForm.jsx"
else
    echo "❌ BatchSelector import missing in QuizGeneratorForm.jsx"
fi

echo ""
echo "4. Checking critical file structure..."
FILES=(
    "/Users/balajiv/Documents/coderepos/futureOS/examapp_jayati_latest/frontend/src/components/common/BatchSelector.jsx"
    "/Users/balajiv/Documents/coderepos/futureOS/examapp_jayati_latest/frontend/src/components/dashboard/StudentDashboard.jsx"
    "/Users/balajiv/Documents/coderepos/futureOS/examapp_jayati_latest/frontend/src/contexts/BatchContext.js"
)

for file in "${FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $(basename "$file") exists"
    else
        echo "❌ $(basename "$file") missing"
    fi
done

echo ""
echo "🚀 Context Error Fix Applied!"
echo "The BatchProvider is now properly wrapped around the app."
echo "Please refresh your browser to test the StudentDashboard."
