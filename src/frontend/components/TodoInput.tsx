'use client';

import { useState } from 'react';
import { api } from '../lib/api';

interface TodoInputProps {
  onCreated: () => void;
}

export default function TodoInput({ onCreated }: TodoInputProps) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Title cannot be empty');
      return;
    }
    setError(null);
    try {
      await api.createTodo(trimmed);
      setTitle('');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create todo');
    }
  }

  return (
    <div>
      {error && <div className="error-banner" role="alert">{error}</div>}
      <form className="todo-input-form" onSubmit={handleSubmit}>
        <input
          className="todo-input-field"
          type="text"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="New todo title"
        />
      </form>
    </div>
  );
}
