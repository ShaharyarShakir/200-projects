import type { Request, Response } from 'express';
import { categoryService, CategoryService } from './category.service';
import { sendResponse } from '../../../utils/ApiResponse';
import { asyncHandler } from '../../../utils/asyncHandler';

export class CategoryController {
  constructor(private service: CategoryService = categoryService) {}

  getCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const includeInactive = req.query.includeInactive === 'true';
    const categories = await this.service.getCategories(shopId, includeInactive);
    sendResponse(res, 200, categories, 'Inventory categories retrieved successfully');
  });

  getCategoryById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const { id } = req.params;
    const category = await this.service.getCategoryById(id as string, shopId);
    sendResponse(res, 200, category, 'Inventory category retrieved successfully');
  });

  createCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const category = await this.service.createCategory(shopId, actorId, req.body);
    sendResponse(res, 201, category, 'Inventory category created successfully');
  });

  updateCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const { id } = req.params;
    const updated = await this.service.updateCategory(id as string, shopId, actorId, req.body);
    sendResponse(res, 200, updated, 'Inventory category updated successfully');
  });

  deleteCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const { id } = req.params;
    await this.service.deleteCategory(id as string, shopId, actorId);
    sendResponse(res, 200, null, 'Inventory category deleted successfully');
  });
}

export const categoryController = new CategoryController();
