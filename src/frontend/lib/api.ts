export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
}

const API_BASE = '/api/todos';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  getTodos: (status?: 'all' | 'active' | 'completed'): Promise<Todo[]> => {
    const url = status && status !== 'all' ? `${API_BASE}?status=${status}` : API_BASE;
    return fetch(url).then((r) => handleResponse<Todo[]>(r));
  },

  getTodo: (id: number): Promise<Todo> =>
    fetch(`${API_BASE}/${id}`).then((r) => handleResponse<Todo>(r)),

  createTodo: (title: string): Promise<Todo> =>
    fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    }).then((r) => handleResponse<Todo>(r)),

  updateTodo: (id: number, updates: { title?: string; completed?: boolean }): Promise<Todo> =>
    fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).then((r) => handleResponse<Todo>(r)),

  deleteTodo: (id: number): Promise<void> =>
    fetch(`${API_BASE}/${id}`, { method: 'DELETE' }).then((r) => handleResponse<void>(r)),
};
