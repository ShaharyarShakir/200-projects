import { getDb } from "../mongodb.js";
import { Collection, Document, Filter, UpdateFilter } from "mongodb";

export class BaseRepository<T extends Document> {
  constructor(protected readonly collectionName: string) {}

  protected async getCollection(): Promise<Collection<T>> {
    const db = await getDb();
    return db.collection<T>(this.collectionName);
  }

  async findOne(filter: Filter<T>): Promise<T | null> {
    const col = await this.getCollection();
    return col.findOne(filter) as Promise<T | null>;
  }

  async find(filter: Filter<T>): Promise<T[]> {
    const col = await this.getCollection();
    return col.find(filter).toArray() as Promise<T[]>;
  }

  async insertOne(doc: T): Promise<any> {
    const col = await this.getCollection();
    return col.insertOne(doc as any);
  }

  async updateOne(filter: Filter<T>, update: UpdateFilter<T> | Partial<T>): Promise<any> {
    const col = await this.getCollection();
    return col.updateOne(filter, update);
  }

  async deleteOne(filter: Filter<T>): Promise<any> {
    const col = await this.getCollection();
    return col.deleteOne(filter);
  }
}
