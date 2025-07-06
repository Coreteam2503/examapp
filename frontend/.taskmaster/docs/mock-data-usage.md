# Mock Data Usage Instructions

## 🎭 Testing Universal Question System

The mock data system provides comprehensive test data for all question types in development mode.

## Quick Testing

### 1. HangmanGame with Mock Data (Already Integrated)
The HangmanGame now automatically uses mock data in development:

```bash
npm start
# Navigate to HangmanGame - it will show various question types
```

### 2. Direct Question Testing
Add QuestionTester component to any page for comprehensive testing:

```jsx
// In any component file (development only)
import { QuestionTester } from '../dev';

// Add to render:
{process.env.NODE_ENV === 'development' && <QuestionTester />}
```

### 3. Console Testing
Test question normalization in browser console:

```javascript
// Open browser dev tools console
import { getAllQuestionTypesMock } from './src/data/mockDataHelper.js';
const testData = getAllQuestionTypesMock();
console.log('All question types:', testData);
```

## Mock Data Structure

### Available Question Types:
- **MCQ**: Multiple choice with A/B/C/D options
- **True/False**: Boolean questions  
- **Matching**: Connect pairs (countries→capitals, concepts→definitions)
- **Fill Blank**: Text input with ___BLANK_N___ markers
- **Ordering**: Arrange items in correct sequence

### Game-Specific Data:
```javascript
import { 
  hangmanMockData,    // MCQ + True/False + Fill Blank
  towerMockData,      // MCQ + True/False + Matching  
  ladderMockData,     // MCQ + Ordering + True/False
  allQuestionTypes    // All 5 types combined
} from '../data/mockDataHelper';
```

## Integration Examples

### For Any Game Component:
```javascript
import { withMockData } from '../data/mockDataHelper';

const MyGame = ({ gameData }) => {
  // Automatically use mock data in development if gameData is empty/missing
  const effectiveGameData = withMockData(gameData, 'hangman');
  
  return (
    <QuestionWrapper 
      question={effectiveGameData.questions[currentIndex]}
      onAnswer={handleAnswer}
    />
  );
};
```

### Force Mock Data (for testing):
```javascript
import { forceMockData } from '../data/mockDataHelper';

const testData = forceMockData('all'); // Always use mock data
```

### Custom Question Sets:
```javascript
import { getMockGameData } from '../data/mockDataHelper';

// Get 5 MCQ questions for testing
const mcqOnly = getMockGameData(['mcq'], 5);

// Get mixed set
const mixed = getMockGameData(['mcq', 'true_false', 'matching'], 10);
```

## Testing Checklist

### ✅ HangmanGame Testing:
1. Start app: `npm start`
2. Navigate to HangmanGame
3. Verify questions display correctly
4. Test answer flow: correct → next question, wrong → hangman step
5. Test different question types in sequence

### ✅ QuestionWrapper Testing:
- [ ] MCQ questions render with clickable options
- [ ] True/False shows True/False buttons
- [ ] Matching shows draggable pairs
- [ ] Fill Blank shows input fields at ___BLANK_N___
- [ ] Ordering shows draggable sequence items

### ✅ Answer Processing:
- [ ] Answers captured correctly for each type
- [ ] onAnswer callback receives proper data
- [ ] Question normalization works without errors

## Development Flags

### Enable/Disable Mock Data:
```javascript
// In mockDataHelper.js
export const USE_MOCK_DATA = true; // Force enable
export const USE_MOCK_DATA = false; // Force disable  
export const USE_MOCK_DATA = process.env.NODE_ENV === 'development'; // Auto
```

### Debug Information:
Mock data usage is logged to console:
- `📡 Using real game data:` - When backend data available
- `🎭 Using mock data for [type]:` - When mock data active

## Common Issues & Solutions

### Issue: "Unsupported Question Type" Error
**Solution:** Check question.type field in your data
```javascript
// Question must have valid type
const question = {
  type: 'mcq', // Must be: mcq, true_false, matching, fill_blank, or ordering
  question: 'Your question text',
  // ... other fields
};
```

### Issue: Questions Not Displaying
**Solution:** Verify mock data structure
```javascript
// Game data must have questions array
const gameData = {
  questions: [...], // Array of question objects
  metadata: { ... } // Optional
};
```

### Issue: Answers Not Processing
**Solution:** Check onAnswer callback
```javascript
const handleAnswer = (answer, metadata) => {
  console.log('Answer received:', answer);
  // Process answer here
};
```

## Next Steps

1. **Test HangmanGame** with mock data (already integrated)
2. **Add mock data** to other games as needed:
   - KnowledgeTowerGame
   - WordLadderGame
3. **Use QuestionTester** for isolated question testing
4. **Update backend** to provide real question data in these formats

The mock data system ensures all games work with proper question data during development!
