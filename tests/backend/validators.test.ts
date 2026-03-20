import { describe, it, expect } from 'vitest';
import { createTodoSchema, updateTodoSchema } from '../../src/backend/validators/todo.js';

describe('createTodoSchema', () => {
  it('accepts a valid title', () => {
    const result = createTodoSchema.safeParse({ title: 'Buy milk' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe('Buy milk');
  });

  it('rejects empty string title', () => {
    const result = createTodoSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing title', () => {
    const result = createTodoSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects title over 500 chars', () => {
    const result = createTodoSchema.safeParse({ title: 'a'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('accepts title at exactly 500 chars', () => {
    const result = createTodoSchema.safeParse({ title: 'a'.repeat(500) });
    expect(result.success).toBe(true);
  });
});

describe('updateTodoSchema', () => {
  it('accepts only title update', () => {
    const result = updateTodoSchema.safeParse({ title: 'Updated title' });
    expect(result.success).toBe(true);
  });

  it('accepts only completed update', () => {
    const result = updateTodoSchema.safeParse({ completed: true });
    expect(result.success).toBe(true);
  });

  it('accepts both title and completed', () => {
    const result = updateTodoSchema.safeParse({ title: 'New', completed: false });
    expect(result.success).toBe(true);
  });

  it('rejects empty object (no fields)', () => {
    const result = updateTodoSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects empty string title', () => {
    const result = updateTodoSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });
});
