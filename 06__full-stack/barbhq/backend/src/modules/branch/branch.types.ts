export interface BranchAddressDto {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface CreateBranchDto {
  name: string;
  phone?: string;
  email?: string;
  address?: BranchAddressDto;
  timezone?: string;
}

export interface UpdateBranchDto {
  name?: string;
  phone?: string;
  email?: string;
  address?: BranchAddressDto;
  timezone?: string;
  isActive?: boolean;
}
