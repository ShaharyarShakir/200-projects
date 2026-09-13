import { products as catalogProducts } from '~/shared/data/products'
import type { Product } from '~/shared/types/product'

export const useProducts = () => {
  const products = readonly(ref<Product[]>(catalogProducts))

  const getProduct = (slug: string): Product | undefined => {
    return products.value.find(
      item =>
        item.slug === slug ||
        (slug === 'tiny-image-compressor' && item.slug === 'tiny-compressor'),
    )
  }

  const featuredProduct = computed<Product | undefined>(() => products.value[0])

  const availableProducts = computed<Product[]>(() =>
    products.value.filter(item => item.status === 'available'),
  )

  const comingSoonProducts = computed<Product[]>(() =>
    products.value.filter(item => item.status === 'coming-soon'),
  )

  return {
    products,
    getProduct,
    featuredProduct,
    availableProducts,
    comingSoonProducts,
  }
}
