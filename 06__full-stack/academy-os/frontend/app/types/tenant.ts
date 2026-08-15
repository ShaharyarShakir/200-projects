export type TenantRole =
  | 'owner'
  | 'admin'
  | 'instructor'
  | 'student'

export interface Tenant {
  id: string
  name: string
  slug: string
}

export interface TenantMembership {
  tenant: Tenant
  role: TenantRole
}
