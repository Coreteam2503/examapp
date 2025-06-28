/**
 * Quiz Prompt Builder - Handles building prompts for quiz generation
 */
class QuizPromptBuilder {
  
  /**
   * System prompt for quiz generation
   */
  getSystemPrompt() {
    return `You are an expert educational content creator specialized in generating high-quality quiz questions from code and technical content.

Your responsibilities:
1. Analyze the provided content and extract key concepts, functions, patterns, and logic
2. Generate educational questions that test understanding, not just memorization
3. Create questions at appropriate difficulty levels
4. Ensure questions are technically accurate and pedagogically sound
5. Format responses in valid JSON structure

Guidelines:
- Focus on concepts, logic, best practices, and problem-solving
- Avoid trivial syntax questions unless specifically requested
- Include code snippets in questions when relevant
- Make distractors (wrong answers) plausible but clearly incorrect
- Ensure questions test different cognitive levels (comprehension, application, analysis)`;
  }

  /**
   * Build the main quiz generation prompt
   */
  buildQuizGenerationPrompt(content, options) {
    const { difficulty, numQuestions, questionTypes, language } = options;

    console.log('🔨 [QuizPromptBuilder] Building quiz generation prompt...');
    console.log('📝 [QuizPromptBuilder] Prompt parameters:', { difficulty, numQuestions, questionTypes, language });

    // Truncate content if too large to avoid token limits
    const maxContentLength = 8000; // Keep content under 8k chars to stay within token limits
    let processedContent = content;
    if (content.length > maxContentLength) {
      console.log(`⚠️ [QuizPromptBuilder] Content too large (${content.length} chars), truncating to ${maxContentLength} chars`);
      processedContent = content.substring(0, maxContentLength) + '\n\n[Content truncated for processing...]';
    }

    const prompt = `Please analyze the following ${language !== 'auto-detect' ? language : ''} content and generate ${numQuestions} high-quality quiz questions.

CONTENT TO ANALYZE:
\`\`\`
${processedContent}
\`\`\`

REQUIREMENTS:
- Difficulty Level: ${difficulty}
- Number of Questions: ${numQuestions}
- Question Types: ${questionTypes.join(', ')}
- Focus on understanding concepts, not just syntax memorization
- Include relevant code snippets in questions when helpful
- Make sure each question tests different aspects of the content

QUESTION TYPE GUIDELINES:

1. MULTIPLE CHOICE (multiple_choice):
   - Provide 4 options (A, B, C, D)
   - Make distractors plausible but clearly wrong
   - Test conceptual understanding

2. FILL-IN-THE-BLANK (fill_in_the_blank):
   - Use ___BLANK_1___, ___BLANK_2___ etc. for blanks in the question text
   - Provide correctAnswers object with possible answers for each blank
   - Focus on key terms, function names, or critical concepts
   - Include hint if helpful

3. TRUE/FALSE (true_false):
   - Create statements that can be definitively true or false
   - Avoid ambiguous statements
   - Focus on specific facts or concepts

4. DRAG & DROP MATCHING (drag_drop_match):
   - Create pairs of related concepts
   - Provide an array of pairs with 'left' and 'right' properties
   - Focus on definitions, relationships, or associations

5. DRAG & DROP ORDERING (drag_drop_order):
   - Provide items that need to be placed in correct sequence
   - Include the correct order in the correctOrder array
   - Focus on processes, steps, or chronological concepts

RESPONSE FORMAT:
Return a valid JSON object with this exact structure:
{
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "What does this function accomplish?",
      "code_snippet": "// optional code snippet",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correct_answer": "A",
      "explanation": "Detailed explanation of why this is correct",
      "difficulty": "medium",
      "concepts": ["concept1", "concept2"]
    },
    {
      "id": 2,
      "type": "fill_in_the_blank",
      "question": "The ___BLANK_1___ function is used to ___BLANK_2___ elements from an array.",
      "text": "The ___BLANK_1___ function is used to ___BLANK_2___ elements from an array.",
      "code_snippet": "// optional code snippet",
      "correctAnswers": {
        "1": ["filter", "Filter"],
        "2": ["remove", "exclude", "select"]
      },
      "hint": "Think about array methods that create new arrays",
      "explanation": "Detailed explanation",
      "difficulty": "medium",
      "concepts": ["arrays", "methods"]
    },
    {
      "id": 3,
      "type": "true_false",
      "question": "JavaScript arrays are mutable objects.",
      "correct_answer": true,
      "explanation": "Arrays in JavaScript are indeed mutable objects.",
      "difficulty": "easy",
      "concepts": ["arrays", "mutability"]
    },
    {
      "id": 4,
      "type": "drag_drop_match",
      "question": "Match the JavaScript method with its purpose:",
      "pairs": [
        {"left": "map()", "right": "Creates new array with transformed elements"},
        {"left": "filter()", "right": "Creates new array with selected elements"},
        {"left": "reduce()", "right": "Reduces array to single value"}
      ],
      "explanation": "Each array method has a specific purpose for data transformation.",
      "difficulty": "medium",
      "concepts": ["array methods", "functional programming"]
    },
    {
      "id": 5,
      "type": "drag_drop_order",
      "question": "Arrange these steps in the correct order for handling an API request:",
      "items": ["Send request", "Parse response", "Handle errors", "Validate data"],
      "correctOrder": ["Send request", "Handle errors", "Parse response", "Validate data"],
      "explanation": "API requests should follow this logical sequence.",
      "difficulty": "medium",
      "concepts": ["API", "error handling", "data processing"]
    }
  ],
  "metadata": {
    "total_questions": ${numQuestions},
    "difficulty": "${difficulty}",
    "content_type": "detected content type",
    "main_concepts": ["list of main concepts covered"]
  }
}

Generate the questions now:`;

    console.log('✅ [QuizPromptBuilder] Quiz generation prompt built successfully');
    return prompt;
  }
}

module.exports = QuizPromptBuilder;