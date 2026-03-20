import { z } from 'zod';

export const createTodoSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(1, 'Title is required')
    .max(500, 'Title must be 500 characters or fewer'),
});

export const updateTodoSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(500, 'Title must be 500 characters or fewer').optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => data.title !== undefined || data.completed !== undefined, {
    message: 'At least one field (title or completed) must be provided',
  });

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
