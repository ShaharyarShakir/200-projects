import type { MetaData } from './ApiResponse';

export interface PaginationParams {
  page?: number | string;
  limit?: number | string;
}

export interface CalculatedPagination {
  page: number;
  limit: number;
  skip: number;
}

export const getPaginationOptions = (params: PaginationParams): CalculatedPagination => {
  const page = Math.max(1, parseInt(String(params.page || 1), 10));
  const limit = Math.max(1, Math.min(100, parseInt(String(params.limit || 10), 10)));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const buildPaginationMeta = (page: number, limit: number, totalItems: number): MetaData => {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    page,
    limit,
    totalItems,
    totalPages,
  };
};
