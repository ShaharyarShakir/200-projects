import { InventoryCategory, type IInventoryCategory } from '../../../models/inventory-category.model';
import type { CreateCategoryDto, UpdateCategoryDto } from './category.validator';

export class CategoryRepository {
  async findByShop(shopId: string, includeInactive = false): Promise<IInventoryCategory[]> {
    const query: Record<string, any> = { shopId };
    if (!includeInactive) {
      query.isActive = true;
    }
    return InventoryCategory.find(query).sort({ name: 1 });
  }

  async findById(id: string, shopId: string): Promise<IInventoryCategory | null> {
    return InventoryCategory.findOne({ _id: id, shopId });
  }

  async findByName(shopId: string, name: string): Promise<IInventoryCategory | null> {
    return InventoryCategory.findOne({
      shopId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });
  }

  async create(shopId: string, dto: CreateCategoryDto): Promise<IInventoryCategory> {
    return InventoryCategory.create({
      shopId,
      name: dto.name.trim(),
      description: dto.description || '',
    });
  }

  async update(id: string, shopId: string, dto: UpdateCategoryDto): Promise<IInventoryCategory | null> {
    const updateData: Record<string, any> = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    return InventoryCategory.findOneAndUpdate(
      { _id: id, shopId },
      { $set: updateData },
      { returnDocument: 'after' },
    );
  }

  async delete(id: string, shopId: string): Promise<boolean> {
    const result = await InventoryCategory.deleteOne({ _id: id, shopId });
    return result.deletedCount > 0;
  }
}

export const categoryRepository = new CategoryRepository();
