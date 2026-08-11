import { categoryRepository, CategoryRepository } from './category.repository';
import type { CreateCategoryDto, UpdateCategoryDto } from './category.validator';
import type { IInventoryCategory } from '../../../models/inventory-category.model';
import { ApiError } from '../../../utils/ApiError';
import { auditLogService, AuditLogService } from '../../audit-logs/audit-log.service';

const DEFAULT_CATEGORIES = [
  'Hair Products',
  'Beard Products',
  'Consumables',
  'Cleaning',
  'Equipment',
  'Retail',
  'Other',
];

export class CategoryService {
  constructor(
    private repository: CategoryRepository = categoryRepository,
    private auditLog: AuditLogService = auditLogService,
  ) {}

  async ensureDefaultCategories(shopId: string): Promise<void> {
    const existing = await this.repository.findByShop(shopId, true);
    if (existing.length === 0) {
      for (const name of DEFAULT_CATEGORIES) {
        await this.repository.create(shopId, { name, description: `Default ${name} category` });
      }
    }
  }

  async getCategories(shopId: string, includeInactive = false): Promise<IInventoryCategory[]> {
    await this.ensureDefaultCategories(shopId);
    return this.repository.findByShop(shopId, includeInactive);
  }

  async getCategoryById(id: string, shopId: string): Promise<IInventoryCategory> {
    const category = await this.repository.findById(id, shopId);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
    return category;
  }

  async createCategory(shopId: string, actorId: string, dto: CreateCategoryDto): Promise<IInventoryCategory> {
    const duplicate = await this.repository.findByName(shopId, dto.name);
    if (duplicate) {
      throw new ApiError(400, 'A category with this name already exists');
    }

    const category = await this.repository.create(shopId, dto);

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Create Inventory Category',
      entity: 'InventoryCategory',
      entityId: category._id.toString(),
      newValue: category.toJSON(),
    });

    return category;
  }

  async updateCategory(
    id: string,
    shopId: string,
    actorId: string,
    dto: UpdateCategoryDto,
  ): Promise<IInventoryCategory> {
    const category = await this.repository.findById(id, shopId);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    if (dto.name && dto.name.toLowerCase() !== category.name.toLowerCase()) {
      const duplicate = await this.repository.findByName(shopId, dto.name);
      if (duplicate) {
        throw new ApiError(400, 'A category with this name already exists');
      }
    }

    const updated = await this.repository.update(id, shopId, dto);

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Update Inventory Category',
      entity: 'InventoryCategory',
      entityId: id,
      oldValue: category.toJSON(),
      newValue: updated?.toJSON(),
    });

    return updated!;
  }

  async deleteCategory(id: string, shopId: string, actorId: string): Promise<void> {
    const category = await this.repository.findById(id, shopId);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    await this.repository.delete(id, shopId);

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Delete Inventory Category',
      entity: 'InventoryCategory',
      entityId: id,
      oldValue: category.toJSON(),
    });
  }
}

export const categoryService = new CategoryService();
