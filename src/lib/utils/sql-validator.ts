/**
 * Utility functions for SQL validation
 */

/**
 * Validates a SQL default value to ensure it's properly quoted
 * @param value The default value to validate
 * @returns True if the value is valid, false otherwise
 */
export function validateSQLDefaultValue(value: string): boolean {
  // Numeric values don't need quotes
  if (value.match(/^\d+$/)) {
    return true;
  }

  // Boolean values don't need quotes
  if (value === 'true' || value === 'false') {
    return true;
  }

  // NULL doesn't need quotes
  if (value.toUpperCase() === 'NULL') {
    return true;
  }

  // Function calls like NOW() don't need quotes
  if (value.match(/^\w+\(\)$/)) {
    return true;
  }

  // String values need quotes
  if (!value.startsWith("'") || !value.endsWith("'")) {
    return false;
  }

  return true;
}

/**
 * Validates a SQL CREATE TABLE statement for common syntax errors
 * @param sql The SQL statement to validate
 * @returns An object with validation results
 */
export function validateCreateTableSQL(sql: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for unquoted default values
  const defaultRegex = /DEFAULT\s+([^,\s\)]+)/g;
  const matches = sql.matchAll(defaultRegex);

  for (const match of Array.from(matches)) {
    const defaultValue = match[1];

    // Skip numeric values (they don't need quotes)
    if (defaultValue.match(/^\d+$/)) {
      continue;
    }

    // Check if the value is properly quoted
    if (!validateSQLDefaultValue(defaultValue)) {
      errors.push(`Unquoted or invalid default value: ${defaultValue}`);
    }
  }

  // The regex for missing commas was too aggressive and causing false positives
  // Disabling this check for now
  /*
  const columnDefinitions = sql.match(/"\w+"\s+\w+(\s+[^,]+)(?!\s*,\s*"\w+")/g);
  if (columnDefinitions && columnDefinitions.length > 0) {
    errors.push(`Possible missing comma in column definitions: ${columnDefinitions[0]}`);
  }
  */

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates a schema definition object for SQL compatibility
 * @param schema The schema definition object
 * @returns An object with validation results
 */
export function validateSchemaDefinition(schema: Record<string, {
  type: string;
  nullable: boolean;
  defaultValue?: string;
  primaryKey?: boolean;
}>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [column, def] of Object.entries(schema)) {
    // Check default values
    if (def.defaultValue) {
      // String values should be quoted
      if (def.type === 'text' || def.type === 'varchar' || def.type === 'char') {
        if (!def.defaultValue.startsWith("'") || !def.defaultValue.endsWith("'")) {
          errors.push(`Column "${column}" has unquoted string default value: ${def.defaultValue}`);
        }
      }

      // JSON values should be quoted
      if (def.type === 'json' || def.type === 'jsonb') {
        if (!def.defaultValue.startsWith("'") || !def.defaultValue.endsWith("'")) {
          errors.push(`Column "${column}" has unquoted JSON default value: ${def.defaultValue}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
} 
