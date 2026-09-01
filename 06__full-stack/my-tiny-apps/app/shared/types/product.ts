export type ProductStatus = 'available' | 'coming-soon'

export type ProductPlatform =
  | 'android'
  | 'ios'
  | 'windows'
  | 'macos'
  | 'linux'

export interface Product {
  slug: string
  name: string
  shortDescription: string
  description: string
  price: number
  currency: string
  status: ProductStatus
  platforms: ProductPlatform[]
  version: string
  features: string[]
  screenshots?: string[]
  githubRepo?: string
  icon: string
  paddleProductId?: string
  paddlePriceId?: string
}


