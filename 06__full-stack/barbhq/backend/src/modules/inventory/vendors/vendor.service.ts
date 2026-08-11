import { vendorRepository, VendorRepository } from './vendor.repository';
import type { CreateVendorDto, UpdateVendorDto } from './vendor.validator';
import type { IVendor } from '../../../models/vendor.model';
import { ApiError } from '../../../utils/ApiError';
import { auditLogService, AuditLogService } from '../../audit-logs/audit-log.service';

export class VendorService {
  constructor(
    private repository: VendorRepository = vendorRepository,
    private auditLog: AuditLogService = auditLogService,
  ) {}

  async getVendors(shopId: string, includeInactive = false): Promise<IVendor[]> {
    return this.repository.findByShop(shopId, includeInactive);
  }

  async getVendorById(id: string, shopId: string): Promise<IVendor> {
    const vendor = await this.repository.findById(id, shopId);
    if (!vendor) {
      throw new ApiError(404, 'Vendor not found');
    }
    return vendor;
  }

  async createVendor(shopId: string, actorId: string, dto: CreateVendorDto): Promise<IVendor> {
    const duplicate = await this.repository.findByName(shopId, dto.name);
    if (duplicate) {
      throw new ApiError(400, 'A vendor with this name already exists');
    }

    const vendor = await this.repository.create(shopId, dto);

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Create Vendor',
      entity: 'Vendor',
      entityId: vendor._id.toString(),
      newValue: vendor.toJSON(),
    });

    return vendor;
  }

  async updateVendor(
    id: string,
    shopId: string,
    actorId: string,
    dto: UpdateVendorDto,
  ): Promise<IVendor> {
    const vendor = await this.repository.findById(id, shopId);
    if (!vendor) {
      throw new ApiError(404, 'Vendor not found');
    }

    if (dto.name && dto.name.toLowerCase() !== vendor.name.toLowerCase()) {
      const duplicate = await this.repository.findByName(shopId, dto.name);
      if (duplicate) {
        throw new ApiError(400, 'A vendor with this name already exists');
      }
    }

    const updated = await this.repository.update(id, shopId, dto);

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Update Vendor',
      entity: 'Vendor',
      entityId: id,
      oldValue: vendor.toJSON(),
      newValue: updated?.toJSON(),
    });

    return updated!;
  }

  async deleteVendor(id: string, shopId: string, actorId: string): Promise<void> {
    const vendor = await this.repository.findById(id, shopId);
    if (!vendor) {
      throw new ApiError(404, 'Vendor not found');
    }

    await this.repository.delete(id, shopId);

    await this.auditLog.logAction({
      shopId,
      actorId,
      action: 'Delete Vendor',
      entity: 'Vendor',
      entityId: id,
      oldValue: vendor.toJSON(),
    });
  }
}

export const vendorService = new VendorService();
