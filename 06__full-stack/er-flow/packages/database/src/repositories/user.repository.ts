import { BaseRepository } from "./base.repository.js";
import { UserDb, UserDbSchema, COLLECTIONS } from "../collections.js";

export class UserRepository extends BaseRepository<UserDb> {
  constructor() {
    super(COLLECTIONS.USERS);
  }

  async findByEmail(email: string): Promise<UserDb | null> {
    const col = await this.getCollection();
    const doc = await col.findOne({ email });
    if (!doc) return null;
    return UserDbSchema.parse(doc);
  }

  async findById(id: string): Promise<UserDb | null> {
    const col = await this.getCollection();
    const doc = await col.findOne({ _id: id } as any);
    if (!doc) return null;
    return UserDbSchema.parse(doc);
  }

  async createUser(user: Omit<UserDb, "createdAt" | "updatedAt">): Promise<UserDb> {
    const col = await this.getCollection();
    const now = new Date();
    const newDoc: UserDb = {
      ...user,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(newDoc as any);
    return newDoc;
  }
}
