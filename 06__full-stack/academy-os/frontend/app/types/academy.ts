export interface Academy {
  id: string
  ownerUserId?: string
  name: string
  slug: string
  subdomain?: string
  customDomain?: string
  status?: string
  description?: string
  logoUrl?: string
  faviconUrl?: string
  primaryColor?: string
  secondaryColor?: string
  createdAt?: string
  updatedAt?: string
}

export type Tenant = Academy
