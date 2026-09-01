export interface PaddleCheckoutItem {
  priceId: string
  quantity?: number
}

export interface PaddleCustomer {
  email?: string
  id?: string
}

export interface PaddleCustomData {
  [key: string]: string | number | boolean | null
}

export interface PaddleCheckoutOptions {
  items: PaddleCheckoutItem[]
  customer?: PaddleCustomer
  customData?: PaddleCustomData
  settings?: {
    displayMode?: 'overlay' | 'inline'
    theme?: 'light' | 'dark'
    locale?: string
    allowLogout?: boolean
    showAddTaxId?: boolean
    showAddDiscounts?: boolean
    variant?: string
    frameTarget?: string
    frameInitialHeight?: number
    frameStyle?: string
    successUrl?: string
  }
}

export interface PaddleInitializeOptions {
  token: string
  environment?: 'sandbox' | 'production'
  eventCallback?: (event: { name: string; data?: any }) => void
  checkout?: {
    settings?: {
      theme?: 'light' | 'dark'
      displayMode?: 'overlay' | 'inline'
    }
  }
}

export interface PaddleInstance {
  Initialize: (options: PaddleInitializeOptions) => void
  Environment: {
    set: (environment: 'sandbox' | 'production') => void
  }
  Checkout: {
    open: (options: PaddleCheckoutOptions) => void
    close: () => void
  }
}

declare global {
  interface Window {
    Paddle?: PaddleInstance
  }
}

