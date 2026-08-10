import { branchRepository, BranchRepository } from './branch.repository';
import type { CreateBranchDto, UpdateBranchDto } from './branch.types';
import type { IBranch } from '../../models/branch.model';
import { ApiError } from '../../utils/ApiError';

export class BranchService {
  constructor(private repository: BranchRepository = branchRepository) {}

  async createBranch(shopId: string, dto: CreateBranchDto): Promise<IBranch> {
    const existing = await this.repository.findByNameAndShop(dto.name, shopId);
    if (existing) {
      throw new ApiError(400, `Branch with name '${dto.name}' already exists in this shop`);
    }
    return this.repository.create(shopId, dto);
  }

  async getBranchesByShop(shopId: string): Promise<IBranch[]> {
    return this.repository.findAllByShop(shopId);
  }

  async getBranchById(id: string, shopId: string): Promise<IBranch> {
    const branch = await this.repository.findByIdAndShop(id, shopId);
    if (!branch) {
      throw new ApiError(404, 'Branch not found');
    }
    return branch;
  }

  async updateBranch(id: string, shopId: string, dto: UpdateBranchDto): Promise<IBranch> {
    if (dto.name) {
      const existing = await this.repository.findByNameAndShop(dto.name, shopId);
      if (existing && existing._id.toString() !== id) {
        throw new ApiError(400, `Branch with name '${dto.name}' already exists in this shop`);
      }
    }

    const updated = await this.repository.update(id, shopId, dto);
    if (!updated) {
      throw new ApiError(404, 'Branch not found');
    }
    return updated;
  }

  async deleteBranch(id: string, shopId: string): Promise<void> {
    const deleted = await this.repository.delete(id, shopId);
    if (!deleted) {
      throw new ApiError(404, 'Branch not found');
    }
  }
}

export const branchService = new BranchService();
