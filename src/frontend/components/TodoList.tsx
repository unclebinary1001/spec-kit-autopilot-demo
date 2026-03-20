'use client';

import { useState } from 'react';
import useSWR from 'swr';
import type { Todo } from '../lib/api';
import { api } from '../lib/api';
import TodoInput from './TodoInput';
import TodoItem from './TodoItem';
import TodoFilter from './TodoFilter';

type FilterStatus = 'all' | 'active' | 'completed';

function fetcher(status: FilterStatus) {
  return api.getTodos(status);
}

export default function TodoList() {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const { data: todos, error, isLoading, mutate } = useSWR<Todo[]>(
    ['todos', filter],
    ([, f]) => fetcher(f as FilterStatus),
  );

  const activeTodoCount = todos?.filter((t) => !t.completed).length ?? 0;

  return (
    <div>
      {error && (
        <div className="error-banner" role="alert">
          Failed to load todos. Please try again.
        </div>
      )}
      <div className="card">
        <TodoInput onCreated={() => mutate()} />
        <TodoFilter current={filter} onChange={setFilter} />
        {isLoading ? (
          <div className="loading-state" role="status">Loading…</div>
        ) : todos && todos.length > 0 ? (
          <ul style={{ listStyle: 'none' }}>
            {todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onUpdated={() => mutate()}
                onDeleted={() => mutate()}
              />
            ))}
          </ul>
        ) : (
          <div className="empty-state">No todos yet!</div>
        )}
        {todos && todos.length > 0 && (
          <div className="todo-footer">
            {activeTodoCount} item{activeTodoCount !== 1 ? 's' : ''} left
          </div>
        )}
      </div>
    </div>
  );
}
