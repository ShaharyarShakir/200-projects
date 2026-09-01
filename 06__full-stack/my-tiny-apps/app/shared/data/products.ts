import type { Product } from '~/shared/types/product'

export const products: Product[] = [
  {
    slug: 'tiny-compressor',
    name: 'Tiny Compressor',
    shortDescription:
      'Minimal, fast, on-device image and PDF compression utility for Android and iOS.',

    description:
      'A lightweight, privacy-first compression utility designed to shrink image (JPG, PNG, WebP) and PDF file sizes directly on your device. Never uploads files to the cloud, requires zero accounts or subscriptions, and delivers instant, offline results with live size comparison.',

    price: 5,
    currency: 'USD',

    status: 'coming-soon',

    platforms: ['android', 'ios'],

    version: '1.0.0',

    features: [
      'Works 100% offline — zero cloud uploads',
      'Compresses images (JPG, PNG, WebP) & PDF documents',
      'Instant before & after size comparison with percentage saved',
      'One-tap Save and Share actions',
      'Recent compression history for quick re-access',
      'Customizable compression presets & quality tuning',
      'Continuous Over-The-Air (OTA) updates powered by EAS',
      'No account required & zero recurring subscriptions',
    ],

    screenshots: ['/images/screenshots/tiny-compressor.png'],

    icon: '⚡',
    paddleProductId: undefined,
    paddlePriceId: undefined,
  },
]

