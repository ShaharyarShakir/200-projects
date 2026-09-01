import type { PaddleCheckoutOptions, PaddleCustomData } from '~/types/paddle'

const isInitialized = ref(false)
const isLoading = ref(false)

export const usePaddle = () => {
  const config = useRuntimeConfig()
  const clientToken = config.public.paddleClientToken
  const environment = (config.public.paddleEnvironment || 'sandbox') as 'sandbox' | 'production'

  const loadPaddle = async (): Promise<boolean> => {
    if (import.meta.server) return false

    if (window.Paddle && isInitialized.value) {
      return true
    }

    if (isLoading.value) {
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (isInitialized.value) {
            clearInterval(interval)
            resolve(true)
          }
        }, 50)
      })
    }

    isLoading.value = true

    try {
      if (!window.Paddle) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'
          script.async = true
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load Paddle.js'))
          document.head.appendChild(script)
        })
      }

      if (window.Paddle) {
        if (environment === 'sandbox') {
          window.Paddle.Environment.set('sandbox')
        }

        if (clientToken) {
          window.Paddle.Initialize({
            token: clientToken,
            environment,
          })
        }
        isInitialized.value = true
      }

      return true
    } catch (error) {
      console.error('Failed to initialize Paddle.js:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const openCheckout = async (
    priceId: string,
    options?: {
      customerEmail?: string
      customData?: PaddleCustomData
    },
  ) => {
    if (import.meta.server) return

    await loadPaddle()

    if (!window.Paddle) {
      throw new Error('Paddle.js is not loaded')
    }

    if (!clientToken) {
      console.warn(
        'Paddle Client Token is not set. Please set PADDLE_CLIENT_TOKEN in your .env file.',
      )
    }

    const checkoutOptions: PaddleCheckoutOptions = {
      items: [
        {
          priceId,
          quantity: 1,
        },
      ],
      settings: {
        displayMode: 'overlay',
        theme: 'light',
      },
    }

    if (options?.customerEmail) {
      checkoutOptions.customer = {
        email: options.customerEmail,
      }
    }

    if (options?.customData) {
      checkoutOptions.customData = options.customData
    }

    window.Paddle.Checkout.open(checkoutOptions)
  }

  return {
    loadPaddle,
    openCheckout,
    isInitialized: readonly(isInitialized),
    isLoading: readonly(isLoading),
  }
}

