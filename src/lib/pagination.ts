import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function getPaginationOffset(query: PaginationQuery): { offset: number; limit: number } {
  const limit = query.limit;
  const offset = (query.page - 1) * limit;
  return { offset, limit };
}

export function buildPaginationMeta(total: number, query: PaginationQuery) {
  const totalPages = Math.ceil(total / query.limit) || 1;
  return {
    page: query.page,
    limit: query.limit,
    total,
    totalPages,
    hasNextPage: query.page < totalPages,
    hasPreviousPage: query.page > 1,
  };
}
