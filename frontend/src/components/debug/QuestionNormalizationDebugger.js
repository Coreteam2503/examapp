/**
 * Debug component to test question normalization with real backend data
 * Place this in your application to test the fixes
 */
import React from 'react';
import { normalizeQuestion } from '../../utils/questionNormalizer';

const QuestionNormalizationDebugger = () => {
  // Sample backend question (from the quiz response you provided)
  const backendQuestion = {
    "id": 503,
    "type": "drag_drop_order",
    "question_text": "Arrange the steps in the Educosys RAG pipeline:",
    "items": "Load documents,Split text,Create embeddings,Store in ChromaDB,Query retriever,Use LLM to generate answer",
    "correct_order": "Load documents,Split text,Create embeddings,Store in ChromaDB,Query retriever,Use LLM to generate answer",
    "explanation": "This represents the standard flow in a LangChain-based RAG system.",
    "difficulty": "medium"
  };

  const mcqQuestion = {
    "id": 505,
    "type": "multiple_choice",
    "question_text": "Which of the following is used to split documents into chunks in the RAG pipeline?",
    "options": "A) RecursiveCharacterTextSplitter\nB) TokenTextSplitter\nC) ChunkSplitter\nD) ParagraphSplitter",
    "correct_answer": "A",
    "explanation": "RecursiveCharacterTextSplitter is commonly used to divide long documents into manageable chunks.",
    "difficulty": "medium"
  };

  const fillBlankQuestion = {
    "id": 504,
    "type": "fill_blank",
    "question_text": "The _____ class in LangChain is used to create a chain that uses a retriever and an LLM together.",
    "correct_answer": "RetrievalQA",
    "explanation": "RetrievalQA combines a retriever and a language model to answer questions using retrieved documents.",
    "difficulty": "medium"
  };

  const normalizedOrdering = normalizeQuestion(backendQuestion);
  const normalizedMCQ = normalizeQuestion(mcqQuestion);
  const normalizedFillBlank = normalizeQuestion(fillBlankQuestion);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#f5f5f5' }}>
      <h2>🔧 Question Normalization Debugger</h2>
      
      <div style={{ marginBottom: '30px' }}>
        <h3>📋 Ordering Question (drag_drop_order → ordering)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h4>Backend Format:</h4>
            <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px' }}>
              {JSON.stringify({
                type: backendQuestion.type,
                question_text: backendQuestion.question_text,
                items: backendQuestion.items,
                correct_order: backendQuestion.correct_order
              }, null, 2)}
            </pre>
          </div>
          <div>
            <h4>Normalized Format:</h4>
            <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px' }}>
              {JSON.stringify({
                type: normalizedOrdering.type,
                question: normalizedOrdering.question,
                items: normalizedOrdering.items,
                correct_sequence: normalizedOrdering.correct_sequence
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>🔘 MCQ Question (multiple_choice → mcq)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h4>Backend Format:</h4>
            <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px' }}>
              {JSON.stringify({
                type: mcqQuestion.type,
                question_text: mcqQuestion.question_text,
                options: mcqQuestion.options,
                correct_answer: mcqQuestion.correct_answer
              }, null, 2)}
            </pre>
          </div>
          <div>
            <h4>Normalized Format:</h4>
            <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px' }}>
              {JSON.stringify({
                type: normalizedMCQ.type,
                question: normalizedMCQ.question,
                options: normalizedMCQ.options,
                correct_answer: normalizedMCQ.correct_answer
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>✏️ Fill Blank Question (fill_blank)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h4>Backend Format:</h4>
            <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px' }}>
              {JSON.stringify({
                type: fillBlankQuestion.type,
                question_text: fillBlankQuestion.question_text,
                correct_answer: fillBlankQuestion.correct_answer
              }, null, 2)}
            </pre>
          </div>
          <div>
            <h4>Normalized Format:</h4>
            <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px' }}>
              {JSON.stringify({
                type: normalizedFillBlank.type,
                question: normalizedFillBlank.question,
                blanks: normalizedFillBlank.blanks,
                correct_answer: normalizedFillBlank.correct_answer
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      <div style={{ background: '#e8f5e8', padding: '15px', borderRadius: '4px' }}>
        <h4>✅ Status Check:</h4>
        <ul>
          <li>Ordering type: {normalizedOrdering.type === 'ordering' ? '✅' : '❌'} {normalizedOrdering.type}</li>
          <li>MCQ type: {normalizedMCQ.type === 'mcq' ? '✅' : '❌'} {normalizedMCQ.type}</li>
          <li>Fill blank type: {normalizedFillBlank.type === 'fill_blank' ? '✅' : '❌'} {normalizedFillBlank.type}</li>
          <li>Ordering items: {Array.isArray(normalizedOrdering.items) ? '✅' : '❌'} {normalizedOrdering.items?.length || 0} items</li>
          <li>MCQ options: {Array.isArray(normalizedMCQ.options) ? '✅' : '❌'} {normalizedMCQ.options?.length || 0} options</li>
          <li>Fill blank blanks: {normalizedFillBlank.blanks && Object.keys(normalizedFillBlank.blanks).length > 0 ? '✅' : '❌'}</li>
        </ul>
      </div>
    </div>
  );
};

export default QuestionNormalizationDebugger;
