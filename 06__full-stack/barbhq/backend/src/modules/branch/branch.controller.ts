import type { Request, Response } from 'express';
import { branchService, BranchService } from './branch.service';
import { sendResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

export class BranchController {
  constructor(private service: BranchService = branchService) {}

  getBranches = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const branches = await this.service.getBranchesByShop(shopId);
    sendResponse(res, 200, branches, 'Branches retrieved successfully');
  });

  getBranchById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const id = req.params.id as string;
    const branch = await this.service.getBranchById(id, shopId);
    sendResponse(res, 200, branch, 'Branch details retrieved successfully');
  });

  createBranch = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const branch = await this.service.createBranch(shopId, req.body);
    sendResponse(res, 201, branch, 'Branch created successfully');
  });

  updateBranch = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const id = req.params.id as string;
    const branch = await this.service.updateBranch(id, shopId, req.body);
    sendResponse(res, 200, branch, 'Branch updated successfully');
  });

  deleteBranch = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const id = req.params.id as string;
    await this.service.deleteBranch(id, shopId);
    sendResponse(res, 200, null, 'Branch deleted successfully');
  });
}

export const branchController = new BranchController();
