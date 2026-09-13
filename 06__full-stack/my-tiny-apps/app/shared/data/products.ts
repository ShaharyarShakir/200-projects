import type { Product } from '~/shared/types/product'

export const products: Product[] = [
  {
    slug: 'tiny-compressor',
    name: 'Tiny Compressor',
    shortDescription:
      'Minimal, fast, 100% on-device image and PDF compression utility for Android.',

    description:
      'A lightweight, privacy-first compression utility designed to shrink image (JPG, PNG, WebP) and PDF file sizes directly on your device. Never uploads files to the cloud, requires zero accounts or subscriptions, and delivers instant, offline results with live size comparison, smart presets, and reclaimed space history.',

    price: 7,
    currency: 'USD',

    status: 'coming-soon',

    platforms: ['android'],

    version: '1.0.0',

    features: [
      '100% On-Device & Offline — zero cloud uploads, maximum privacy',
      'Compresses images (JPG, PNG, WebP) and multipage PDF documents',
      'Smart Presets & Resizing — 4K, 2K, 1080p, or custom quality tuning',
      'Heavy PDFs Made Light — shrink large documents for effortless sharing',
      'Instant before & after size comparison with percentage saved',
      'One-tap Save and Share actions to any app',
      'Reclaimed Space History — track and review your total storage saved',
      'Continuous Over-The-Air (OTA) updates powered by EAS',
      'No account required & zero recurring subscriptions',
    ],

    screenshots: [
      '/images/screenshots/01-home-1.png',
      '/images/screenshots/02-home-2.png',
      '/images/screenshots/03-image-presets.png',
      '/images/screenshots/04-pdf-compress.png',
      '/images/screenshots/05-results-savings.png',
      '/images/screenshots/06-recent-history.png',
    ],

    icon: '/images/icons/tiny-com-icon.png',
    paddleProductId: undefined,
    paddlePriceId: undefined,
  },
]

