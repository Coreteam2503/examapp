# ExamApp E2E Testing Suite

This directory contains comprehensive end-to-end tests for the ExamApp using Playwright. The tests cover all game mechanics, universal question components, and user interactions.

## 📁 Structure

```
e2e-tests/
├── playwright.config.js       # Playwright configuration
├── package.json               # Dependencies and scripts
├── tests/                     # All test files
│   ├── games/                 # Game-specific tests
│   │   ├── hangman.spec.js    # Hangman game tests
│   │   ├── word-ladder.spec.js # Word Ladder game tests
│   │   └── knowledge-tower.spec.js # Knowledge Tower tests
│   ├── questions/             # Question component tests
│   │   └── universal-questions.spec.js
│   └── integration.spec.js    # End-to-end integration tests
├── utils/                     # Test utilities
│   ├── game-utils.js          # Game testing utilities
│   ├── global-setup.js        # Global test setup
│   └── global-teardown.js     # Global test cleanup
└── fixtures/                  # Test data
    └── test-data.js           # Game test scenarios
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd e2e-tests
npm install
```

### 2. Install Playwright Browsers

```bash
npm run install-browsers
```

### 3. Start the Frontend Server

Make sure your frontend is running on `http://localhost:3000`:

```bash
cd ../frontend
npm start
```

### 4. Run Tests

```bash
# Run all tests
npm test

# Run tests with browser UI visible
npm run test:headed

# Run specific game tests
npm run test:hangman
npm run test:ladder
npm run test:tower

# Run question component tests
npm run test:questions

# Run tests with interactive UI
npm run test:ui

# Debug tests step by step
npm run test:debug
```

## 🎯 Test Coverage

### Game Tests

#### Hangman Game (`tests/games/hangman.spec.js`)
- ✅ Game startup and initialization
- ✅ Hangman visual display and progression
- ✅ Correct answer handling (hangman stays safe)
- ✅ Wrong answer handling (hangman progression)
- ✅ Game completion with all correct answers
- ✅ Game over when hangman dies (6 wrong answers)
- ✅ Mixed answer scenarios
- ✅ Exit functionality and confirmation
- ✅ Time tracking
- ✅ Question progress tracking
- ✅ Multiple question type handling

#### Word Ladder Game (`tests/games/word-ladder.spec.js`)
- ✅ Game startup and ladder display
- ✅ Ladder climbing with correct answers
- ✅ Staying at same level with wrong answers
- ✅ Complete ladder climbing success
- ✅ Partial progress scenarios
- ✅ Visual ladder progression
- ✅ Exit functionality
- ✅ Time tracking
- ✅ Game instructions display
- ✅ Character avatar display
- ✅ Retry functionality
- ✅ Final score screen

#### Knowledge Tower Game (`tests/games/knowledge-tower.spec.js`)
- ✅ Game startup and tower display
- ✅ Tower level progression
- ✅ Retry functionality for wrong answers
- ✅ Complete tower climbing
- ✅ Tower visual animations
- ✅ Question themes and difficulty display
- ✅ Multiple question type handling
- ✅ Retry vs continue button logic
- ✅ Game completion flow

### Universal Question Components (`tests/questions/universal-questions.spec.js`)
- ✅ MCQ question display and interaction
- ✅ True/False question functionality
- ✅ Fill-in-the-blank input handling
- ✅ Matching question mechanics
- ✅ Ordering question drag-and-drop
- ✅ Universal result modal behavior
- ✅ Result modal action buttons
- ✅ Question text display
- ✅ Disabled state handling
- ✅ Explanation display
- ✅ Error state handling
- ✅ Consistent styling verification

### Integration Tests (`tests/integration.spec.js`)
- ✅ Complete game workflow testing
- ✅ Cross-game functionality verification
- ✅ Universal result modal consistency
- ✅ Question type compatibility
- ✅ Game exit functionality
- ✅ Performance under rapid interactions
- ✅ Network delay handling
- ✅ Game state consistency

## 🛠️ Key Features

### Automated Testing
- **Complete Game Flows**: Tests entire game sessions from start to finish
- **Question Type Coverage**: Validates all question formats (MCQ, True/False, Fill-blank, Matching, Ordering)
- **Result Modal Testing**: Ensures consistent user feedback across all games
- **Error Handling**: Verifies graceful handling of edge cases and errors

### Cross-Browser Testing
- **Multiple Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Testing**: Tests on mobile viewports (iPhone, Android)
- **Responsive Design**: Validates UI across different screen sizes

### Performance Testing
- **Rapid Interaction**: Tests quick successive user actions
- **Network Simulation**: Tests with delayed network responses
- **State Consistency**: Validates game state remains consistent

### Visual Testing
- **Screenshot Capture**: Automatic screenshots on test failures
- **Video Recording**: Records test sessions for debugging
- **Visual Progression**: Validates game animations and state changes

## 📊 Test Reports

Tests generate comprehensive reports:
- **HTML Report**: Visual test results with screenshots
- **JSON Report**: Machine-readable test data
- **Console Output**: Real-time test progress

Access reports at `playwright-report/index.html` after running tests.

## 🔧 Configuration

### Browser Settings
- **Headless Mode**: Default for CI/CD
- **Headed Mode**: Available for debugging
- **Custom Timeouts**: Configured for game interactions
- **Screenshot/Video**: Captured on failures

### Test Data
- **Fixture Data**: Predefined test scenarios
- **Dynamic Adaptation**: Tests adapt to available question types
- **Error Recovery**: Continues testing despite individual failures

## 🚨 Troubleshooting

### Common Issues
1. **Frontend Not Running**: Ensure `npm start` in frontend directory
2. **Port Conflicts**: Check port 3000 is available
3. **Browser Installation**: Run `npm run install-browsers`
4. **Timeout Errors**: Games may need more time to load

### Debug Mode
Use `npm run test:debug` to step through tests interactively and identify issues.

## 📝 Maintenance

### Adding New Tests
1. Create test files in appropriate directories
2. Use `GameTestUtils` for common game actions
3. Follow existing naming conventions
4. Add test data to fixtures if needed

### Updating Tests
- Modify selectors if UI changes
- Update test data for new question formats
- Adjust timeouts for performance changes
- Add new game types as needed

This testing suite ensures the ExamApp maintains high quality and reliability across all game modes and question types.
