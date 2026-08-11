import { Vendor, type IVendor } from '../../../models/vendor.model';
import type { CreateVendorDto, UpdateVendorDto } from './vendor.validator';

export class VendorRepository {
  async findByShop(shopId: string, includeInactive = false): Promise<IVendor[]> {
    const query: Record<string, any> = { shopId };
    if (!includeInactive) {
      query.isActive = true;
    }
    return Vendor.find(query).sort({ name: 1 });
  }

  async findById(id: string, shopId: string): Promise<IVendor | null> {
    return Vendor.findOne({ _id: id, shopId });
  }

  async findByName(shopId: string, name: string): Promise<IVendor | null> {
    return Vendor.findOne({
      shopId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });
  }

  async create(shopId: string, dto: CreateVendorDto): Promise<IVendor> {
    return Vendor.create({
      shopId,
      name: dto.name.trim(),
      contactName: dto.contactName || '',
      email: dto.email || '',
      phone: dto.phone || '',
      address: dto.address || '',
    });
  }

  async update(id: string, shopId: string, dto: UpdateVendorDto): Promise<IVendor | null> {
    const updateData: Record<string, any> = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.contactName !== undefined) updateData.contactName = dto.contactName;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    return Vendor.findOneAndUpdate({ _id: id, shopId }, { $set: updateData }, { returnDocument: 'after' });
  }

  async delete(id: string, shopId: string): Promise<boolean> {
    const result = await Vendor.deleteOne({ _id: id, shopId });
    return result.deletedCount > 0;
  }
}

export const vendorRepository = new VendorRepository();
