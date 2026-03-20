'use client';

import { useState, useRef, useEffect } from 'react';
import type { Todo } from '../lib/api';
import { api } from '../lib/api';

interface TodoItemProps {
  todo: Todo;
  onUpdated: () => void;
  onDeleted: () => void;
}

export default function TodoItem({ todo, onUpdated, onDeleted }: TodoItemProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  async function handleToggle() {
    try {
      await api.updateTodo(todo.id, { completed: !todo.completed });
      onUpdated();
    } catch (err) {
      console.error('Failed to toggle todo:', err);
    }
  }

  async function handleDelete() {
    try {
      await api.deleteTodo(todo.id);
      onDeleted();
    } catch (err) {
      console.error('Failed to delete todo:', err);
    }
  }

  async function handleEditSave() {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      setEditTitle(todo.title);
      setEditing(false);
      return;
    }
    try {
      await api.updateTodo(todo.id, { title: trimmed });
      onUpdated();
      setEditing(false);
    } catch (err) {
      console.error('Failed to update todo:', err);
      setEditing(false);
    }
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      setEditTitle(todo.title);
      setEditing(false);
    }
  }

  return (
    <li className="todo-item">
      <input
        type="checkbox"
        className="todo-checkbox"
        checked={todo.completed}
        onChange={handleToggle}
        aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
      />
      {editing ? (
        <input
          ref={inputRef}
          className="todo-edit-input"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleEditSave}
          onKeyDown={handleEditKeyDown}
          aria-label="Edit todo title"
        />
      ) : (
        <span
          className={`todo-title${todo.completed ? ' completed' : ''}`}
          onDoubleClick={() => {
            setEditTitle(todo.title);
            setEditing(true);
          }}
          title="Double-click to edit"
        >
          {todo.title}
        </span>
      )}
      <button
        className="todo-delete-btn"
        onClick={handleDelete}
        aria-label={`Delete "${todo.title}"`}
        title="Delete"
      >
        ✕
      </button>
    </li>
  );
}
