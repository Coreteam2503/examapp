#!/bin/bash

# Quick Test Runner for ExamApp E2E Tests
# Makes it easy to run tests and see results

echo "🎯 ExamApp E2E Test Runner"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run tests and show results
run_test() {
    local test_name="$1"
    local test_path="$2"
    
    echo -e "\n${BLUE}🚀 Running: ${test_name}${NC}"
    echo "================================"
    
    # Run the test
    if npx playwright test "$test_path" --project=chromium --reporter=list; then
        echo -e "${GREEN}✅ ${test_name} - PASSED${NC}"
    else
        echo -e "${RED}❌ ${test_name} - FAILED${NC}"
        
        # Show recent screenshots if available
        echo -e "${YELLOW}📸 Recent Screenshots:${NC}"
        find test-results -name "*.png" -mtime -1 2>/dev/null | head -3 | while read -r file; do
            echo "   $file"
        done
    fi
}

# Function to show test report
show_report() {
    echo -e "\n${BLUE}📊 Opening Test Report...${NC}"
    if [ -f "playwright-report/index.html" ]; then
        if command -v open &> /dev/null; then
            open playwright-report/index.html
        elif command -v xdg-open &> /dev/null; then
            xdg-open playwright-report/index.html
        else
            echo "Report available at: $(pwd)/playwright-report/index.html"
        fi
    else
        echo "No report found. Run tests first."
    fi
}

# Function to list recent bugs/failures
show_bugs() {
    echo -e "\n${RED}🐛 Recent Test Failures:${NC}"
    echo "========================"
    
    if [ -d "test-results" ]; then
        # Find recent failure directories
        find test-results -maxdepth 1 -type d -name "*-chromium" -mtime -1 2>/dev/null | head -10 | while read -r dir; do
            if [ -f "$dir/test-failed-1.png" ]; then
                test_name=$(basename "$dir" | sed 's/-chromium$//' | sed 's/.*-//')
                echo -e "${YELLOW}❌ $test_name${NC}"
                echo "   Screenshot: $dir/test-failed-1.png"
                if [ -f "$dir/video.webm" ]; then
                    echo "   Video: $dir/video.webm"
                fi
                echo ""
            fi
        done
    else
        echo "No test results found. Run tests first."
    fi
}

# Function to run quick smoke test
smoke_test() {
    echo -e "\n${BLUE}💨 Running Quick Smoke Test${NC}"
    echo "============================="
    
    # Test just basic navigation and login
    npx playwright test tests/games/hangman.spec.js --grep "should start hangman game successfully" --project=chromium --reporter=list
}

# Main menu
case "$1" in
    "hangman"|"h")
        run_test "Hangman Game Tests" "tests/games/hangman.spec.js"
        ;;
    "ladder"|"l")
        run_test "Word Ladder Game Tests" "tests/games/word-ladder.spec.js"
        ;;
    "tower"|"t")
        run_test "Knowledge Tower Game Tests" "tests/games/knowledge-tower.spec.js"
        ;;
    "questions"|"q")
        run_test "Question Component Tests" "tests/questions/universal-questions.spec.js"
        ;;
    "integration"|"i")
        run_test "Integration Tests" "tests/integration.spec.js"
        ;;
    "all"|"a")
        echo -e "${BLUE}🚀 Running All Tests${NC}"
        npx playwright test --reporter=html
        show_report
        ;;
    "smoke"|"s")
        smoke_test
        ;;
    "report"|"r")
        show_report
        ;;
    "bugs"|"b")
        show_bugs
        ;;
    "clean"|"c")
        echo -e "${YELLOW}🧹 Cleaning test results...${NC}"
        rm -rf test-results playwright-report
        echo "✅ Cleaned"
        ;;
    *)
        echo "Usage: $0 [option]"
        echo ""
        echo "Game Tests:"
        echo "  hangman, h    - Test Hangman game"
        echo "  ladder, l     - Test Word Ladder game"
        echo "  tower, t      - Test Knowledge Tower game"
        echo ""
        echo "Component Tests:"
        echo "  questions, q  - Test Universal Question components"
        echo "  integration, i- Test end-to-end integration"
        echo ""
        echo "Utilities:"
        echo "  all, a        - Run all tests with HTML report"
        echo "  smoke, s      - Quick smoke test"
        echo "  report, r     - Open test report"
        echo "  bugs, b       - Show recent failures"
        echo "  clean, c      - Clean test results"
        echo ""
        echo "Examples:"
        echo "  $0 hangman    # Test hangman game"
        echo "  $0 smoke      # Quick test"
        echo "  $0 bugs       # See failures"
        echo "  $0 all        # Full test suite"
        ;;
esac
