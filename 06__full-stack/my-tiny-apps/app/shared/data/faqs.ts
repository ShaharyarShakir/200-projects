import type { FaqItem } from '~/shared/types/faq'

export const faqs: FaqItem[] = [
  {
    question: 'How do app licenses work?',
    answer:
      'Every app purchase is a one-time payment for lifetime access. There are no recurring monthly or yearly fees, and all future maintenance updates are included at no extra charge.',
  },
  {
    question: 'Can I install my purchased app on multiple personal devices?',
    answer:
      'Yes. A personal license allows you to install and activate the app on all personal devices running the supported operating system.',
  },
  {
    question: 'What is your refund policy?',
    answer:
      'If an app does not work as expected on your device and our support team cannot resolve the problem, we provide a full refund within 14 days of purchase.',
  },
  {
    question: 'Do tiny apps require an active internet connection?',
    answer:
      'No. Offline-capable apps (like Tiny Image Compressor) are built to execute 100% locally on your device without sending any data over the network.',
  },
]
