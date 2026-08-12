import type { Model, Document, QueryFilter, UpdateQuery, QueryOptions } from 'mongoose';
import type { IBaseRepository } from '../interfaces/repository.interface';

export abstract class BaseRepository<T extends Document> implements IBaseRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  public async create(data: Partial<T>): Promise<T> {
    const doc = new this.model(data);
    return (await doc.save()) as T;
  }

  public async findById(id: string): Promise<T | null> {
    return await this.model.findById(id).exec();
  }

  public async findOne(filter: QueryFilter<T>): Promise<T | null> {
    return await this.model.findOne(filter).exec();
  }

  public async find(filter: QueryFilter<T> = {}, options: QueryOptions = {}): Promise<T[]> {
    return await this.model.find(filter, null, options).exec();
  }

  public async update(id: string, updateData: UpdateQuery<T>): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).exec();
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }

  public async count(filter: QueryFilter<T> = {}): Promise<number> {
    return await this.model.countDocuments(filter).exec();
  }
}
