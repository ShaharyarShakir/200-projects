import type { Request, Response } from 'express';
import { vendorService, VendorService } from './vendor.service';
import { sendResponse } from '../../../utils/ApiResponse';
import { asyncHandler } from '../../../utils/asyncHandler';

export class VendorController {
  constructor(private service: VendorService = vendorService) {}

  getVendors = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const includeInactive = req.query.includeInactive === 'true';
    const vendors = await this.service.getVendors(shopId, includeInactive);
    sendResponse(res, 200, vendors, 'Vendors retrieved successfully');
  });

  getVendorById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const { id } = req.params;
    const vendor = await this.service.getVendorById(id as string, shopId);
    sendResponse(res, 200, vendor, 'Vendor retrieved successfully');
  });

  createVendor = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const vendor = await this.service.createVendor(shopId, actorId, req.body);
    sendResponse(res, 201, vendor, 'Vendor created successfully');
  });

  updateVendor = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const { id } = req.params;
    const updated = await this.service.updateVendor(id as string, shopId, actorId, req.body);
    sendResponse(res, 200, updated, 'Vendor updated successfully');
  });

  deleteVendor = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const { id } = req.params;
    await this.service.deleteVendor(id as string, shopId, actorId);
    sendResponse(res, 200, null, 'Vendor deleted successfully');
  });
}

export const vendorController = new VendorController();
