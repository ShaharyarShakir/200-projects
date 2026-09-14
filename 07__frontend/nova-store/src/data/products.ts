export interface Product {
  id: string
  name: string
  category: string
  description: string
  price: number
  accent: string
}

export const products: Product[] = [
  {
    id: 'nova-x',
    name: 'NOVA X',
    category: 'Core',
    description: 'Flagship architecture. Reimagined for precision and presence.',
    price: 1299,
    accent: 'Premium titanium',
  },
  {
    id: 'nova-air',
    name: 'NOVA Air',
    category: 'Wearable',
    description: 'Lighter than air. Intelligent in every touch.',
    price: 799,
    accent: 'Ceramic composite',
  },
  {
    id: 'nova-watch',
    name: 'NOVA Watch',
    category: 'Timepiece',
    description: 'Time, reimagined. Minimal interface, maximum clarity.',
    price: 599,
    accent: 'Sapphire crystal',
  },
  {
    id: 'nova-core',
    name: 'NOVA Core',
    category: 'Accessory',
    description: 'The essence of NOVA. Form follows function.',
    price: 399,
    accent: 'Sustainable materials',
  },
]
