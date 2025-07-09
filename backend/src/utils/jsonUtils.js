/**
 * Safely parses JSON fields that might be strings (SQLite) or objects (PostgreSQL)
 * @param {any} value - The value to parse
 * @param {any} defaultValue - Default value if parsing fails or value is empty
 * @returns {any} Parsed value or default
 */
function safeJsonParse(value, defaultValue = null) {
  if (!value) return defaultValue;
  
  // If it's already an object/array (PostgreSQL), return as-is
  if (typeof value === 'object') {
    return value;
  }
  
  // If it's a string (SQLite), try to parse it
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn('Failed to parse JSON:', value, error.message);
      return defaultValue;
    }
  }
  
  return defaultValue;
}

/**
 * Safely parses fields that might be comma-separated strings or JSON arrays
 * @param {any} value - The value to parse (comma-separated string or JSON array)
 * @param {any} defaultValue - Default value if parsing fails or value is empty
 * @returns {any} Parsed array or default
 */
function safeCommaParse(value, defaultValue = null) {
  if (!value) return defaultValue;
  
  // If it's already an array (PostgreSQL), return as-is
  if (Array.isArray(value)) {
    return value;
  }
  
  // If it's a string, try JSON parse first, then comma split
  if (typeof value === 'string') {
    // First try JSON parsing
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      // Not JSON, try comma-separated parsing
    }
    
    // Try comma-separated parsing
    const trimmed = value.trim();
    if (trimmed.includes(',')) {
      return trimmed.split(',').map(item => item.trim()).filter(item => item);
    }
    
    // Single value
    return trimmed ? [trimmed] : defaultValue;
  }
  
  return defaultValue;
}

module.exports = { safeJsonParse, safeCommaParse };
