import type { QueryFilter, UpdateQuery, QueryOptions } from 'mongoose';

export interface IBaseRepository<T> {
  create(data: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findOne(filter: QueryFilter<T>): Promise<T | null>;
  find(filter?: QueryFilter<T>, options?: QueryOptions): Promise<T[]>;
  update(id: string, updateData: UpdateQuery<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(filter?: QueryFilter<T>): Promise<number>;
}
