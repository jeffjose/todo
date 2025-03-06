import { describe, it, expect } from 'vitest';
import * as schema from './schema';
import { validateCreateTableSQL, validateSQLDefaultValue } from '../utils/sql-validator';

describe('Database Schema', () => {
  it('should have valid todos schema', () => {
    expect(schema.todos).toBeDefined();

    // Check that required fields are present
    const todoColumns = Object.keys(schema.todos);
    expect(todoColumns).toContain('id');
    expect(todoColumns).toContain('title');
    expect(todoColumns).toContain('status');
    expect(todoColumns).toContain('priority');
    expect(todoColumns).toContain('urgency');
    expect(todoColumns).toContain('tags');
    expect(todoColumns).toContain('attachments');
    expect(todoColumns).toContain('path');
    expect(todoColumns).toContain('level');
    expect(todoColumns).toContain('createdAt');
    expect(todoColumns).toContain('updatedAt');
  });
});

// This test is for the DESIRED_SCHEMA in db.ts
describe('SQL Schema Validation', () => {
  it('should validate SQL default values correctly', () => {
    // Valid values
    expect(validateSQLDefaultValue("'pending'")).toBe(true);
    expect(validateSQLDefaultValue("'[]'")).toBe(true);
    expect(validateSQLDefaultValue("0")).toBe(true);
    expect(validateSQLDefaultValue("NULL")).toBe(true);
    expect(validateSQLDefaultValue("true")).toBe(true);
    expect(validateSQLDefaultValue("NOW()")).toBe(true);

    // Invalid values
    expect(validateSQLDefaultValue("pending")).toBe(false);
    expect(validateSQLDefaultValue("[]")).toBe(false);
    expect(validateSQLDefaultValue("'unclosed")).toBe(false);
  });

  it('should generate valid SQL for todos table creation', () => {
    // This is a sample CREATE TABLE statement similar to what would be generated
    const sampleSQL = `
      CREATE TABLE IF NOT EXISTS "todos" (
        "id" text NOT NULL PRIMARY KEY,
        "title" text NOT NULL,
        "description" text,
        "emoji" text,
        "deadline" timestamptz,
        "finish_by" timestamptz,
        "status" text NOT NULL DEFAULT 'pending',
        "priority" text NOT NULL DEFAULT 'P3',
        "urgency" text NOT NULL DEFAULT 'medium',
        "tags" json NOT NULL DEFAULT '[]',
        "attachments" json NOT NULL DEFAULT '[]',
        "path" text NOT NULL DEFAULT 'root',
        "level" integer NOT NULL DEFAULT 0,
        "parent_id" text,
        "created_at" timestamptz NOT NULL,
        "updated_at" timestamptz NOT NULL
      )
    `;

    const result = validateCreateTableSQL(sampleSQL);

    // If the test fails, log the errors for debugging
    if (!result.valid) {
      console.error('SQL validation errors:', result.errors);
    }

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should detect invalid SQL default values', () => {
    // This SQL has unquoted string values and unquoted array
    const invalidSQL = `
      CREATE TABLE IF NOT EXISTS "todos" (
        "id" text NOT NULL PRIMARY KEY,
        "status" text NOT NULL DEFAULT pending,
        "tags" json NOT NULL DEFAULT [],
        "level" integer NOT NULL DEFAULT 0
      )
    `;

    const result = validateCreateTableSQL(invalidSQL);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors).toContain('Unquoted or invalid default value: pending');
    expect(result.errors).toContain('Unquoted or invalid default value: []');
  });
}); 
