/**
 * Development Components Index
 * Export development and testing utilities
 */

export { default as QuestionTester } from './QuestionTester';

// Quick access for console testing
export const DevUtils = {
  QuestionTester: () => import('./QuestionTester'),
  MockData: () => import('../../data/mockDataHelper'),
  
  // Helper to quickly add question tester to any component
  addQuestionTester: (Component) => {
    if (process.env.NODE_ENV === 'development') {
      const { QuestionTester } = require('./QuestionTester');
      return () => (
        <div>
          <Component />
          <hr style={{ margin: '40px 0' }} />
          <QuestionTester />
        </div>
      );
    }
    return Component;
  }
};
