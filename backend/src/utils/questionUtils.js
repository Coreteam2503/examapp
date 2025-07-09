/**
 * Question utility functions for data processing
 */

/**
 * Convert plain text options to JSON format for PostgreSQL
 * @param {string} optionsText - Plain text options like "A) Option 1\nB) Option 2"
 * @returns {string|null} - JSON string or null
 */
function convertOptionsToJson(optionsText) {
  if (!optionsText || typeof optionsText !== 'string') {
    return null;
  }

  // If it's already JSON, return as is
  try {
    JSON.parse(optionsText);
    return optionsText;
  } catch (e) {
    // Not JSON, proceed with conversion
  }

  // Split by newlines and process each option
  const lines = optionsText.split('\n').filter(line => line.trim());
  const options = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      // Extract option key and value (A) Option text -> key: A, value: Option text
      const match = trimmed.match(/^([A-Z])\)\s*(.+)$/);
      if (match) {
        options.push({
          key: match[1],
          value: match[2].trim()
        });
      } else {
        // If no pattern match, treat as simple option
        options.push({
          key: String.fromCharCode(65 + options.length), // A, B, C, etc.
          value: trimmed
        });
      }
    }
  }

  return JSON.stringify(options);
}

/**
 * Convert pairs text to JSON format for PostgreSQL
 * @param {string} pairsText - Plain text pairs like "key1|value1\nkey2|value2"
 * @returns {string|null} - JSON string or null
 */
function convertPairsToJson(pairsText) {
  if (!pairsText || typeof pairsText !== 'string') {
    return null;
  }

  // If it's already JSON, return as is
  try {
    JSON.parse(pairsText);
    return pairsText;
  } catch (e) {
    // Not JSON, proceed with conversion
  }

  // Split by newlines and process each pair
  const lines = pairsText.split('\n').filter(line => line.trim());
  const pairs = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      const parts = trimmed.split('|');
      if (parts.length === 2) {
        pairs.push({
          key: parts[0].trim(),
          value: parts[1].trim()
        });
      }
    }
  }

  return JSON.stringify(pairs);
}

/**
 * Convert concepts to JSON format for PostgreSQL
 * @param {string|array} concepts - Concepts as string or array
 * @returns {string} - JSON string
 */
function convertConceptsToJson(concepts) {
  if (!concepts) {
    return '[]';
  }

  if (Array.isArray(concepts)) {
    return JSON.stringify(concepts);
  }

  if (typeof concepts === 'string') {
    // If it's already JSON, return as is
    try {
      JSON.parse(concepts);
      return concepts;
    } catch (e) {
      // Not JSON, treat as comma-separated string
      const conceptsArray = concepts.split(',').map(c => c.trim()).filter(c => c);
      return JSON.stringify(conceptsArray);
    }
  }

  return '[]';
}

/**
 * Prepare question data for PostgreSQL insertion
 * @param {object} questionData - Raw question data
 * @returns {object} - Processed question data
 */
function prepareQuestionForPostgres(questionData) {
  const prepared = { ...questionData };

  // Convert options to JSON if needed
  if (prepared.options) {
    prepared.options = convertOptionsToJson(prepared.options);
  }

  // Convert pairs to JSON if needed
  if (prepared.pairs) {
    prepared.pairs = convertPairsToJson(prepared.pairs);
  }

  // Convert concepts to JSON if needed
  if (prepared.concepts) {
    prepared.concepts = convertConceptsToJson(prepared.concepts);
  } else {
    prepared.concepts = '[]';
  }

  // Ensure other JSON fields are properly formatted
  if (prepared.correct_answers_data && typeof prepared.correct_answers_data !== 'string') {
    prepared.correct_answers_data = JSON.stringify(prepared.correct_answers_data);
  }

  return prepared;
}

module.exports = {
  convertOptionsToJson,
  convertPairsToJson,
  convertConceptsToJson,
  prepareQuestionForPostgres
};
