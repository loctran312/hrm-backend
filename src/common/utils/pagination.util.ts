import { PaginationMeta } from '../types/api-response.type';

export function buildPaginationMeta(page: number, limit: number, totalItems: number): PaginationMeta {
  return {
    page,
    limit,
    totalItems,
    totalPages: limit > 0 ? Math.ceil(totalItems / limit) : 0,
  };
}

export function toSkipTake(page: number, limit: number): { skip: number; take: number } {
  return { skip: (page - 1) * limit, take: limit };
}
