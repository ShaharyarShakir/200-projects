import { Branch, type IBranch } from '../../models/branch.model';
import type { CreateBranchDto, UpdateBranchDto } from './branch.types';

export class BranchRepository {
  async create(shopId: string, data: CreateBranchDto): Promise<IBranch> {
    const branch = new Branch({ ...data, shopId });
    return branch.save();
  }

  async findAllByShop(shopId: string): Promise<IBranch[]> {
    return Branch.find({ shopId }).sort({ createdAt: -1 });
  }

  async findByIdAndShop(id: string, shopId: string): Promise<IBranch | null> {
    return Branch.findOne({ _id: id, shopId });
  }

  async findByNameAndShop(name: string, shopId: string): Promise<IBranch | null> {
    return Branch.findOne({ shopId, name: name.trim() });
  }

  async update(id: string, shopId: string, data: UpdateBranchDto): Promise<IBranch | null> {
    return Branch.findOneAndUpdate(
      { _id: id, shopId },
      { $set: data },
      { new: true, runValidators: true },
    );
  }

  async delete(id: string, shopId: string): Promise<IBranch | null> {
    return Branch.findOneAndDelete({ _id: id, shopId });
  }
}

export const branchRepository = new BranchRepository();
