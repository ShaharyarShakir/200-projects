import type { Academy } from '~/types/academy'

export function useAcademyResolver() {
  const {
    academy,
    setAcademy
  } = useAcademy()

  const resolving =
    useState<boolean>(
      'academy-resolving',
      () => false
    )

  async function resolve(
    hostname: string
  ) {
    if (!hostname) {
      return null
    }

    if (academy.value) {
      return academy.value
    }

    resolving.value = true

    try {
      const config = useRuntimeConfig()
      const apiBase = config.public.apiBase || 'http://localhost:8080'
      const result =
        await $fetch<Academy>(
          `${apiBase}/api/public/resolve-domain`,
          {
            query: {
              domain: hostname
            }
          }
        )

      if (result) {
        setAcademy(result)
      }

      return result
    } catch {
      return null
    } finally {
      resolving.value = false
    }
  }

  return {
    academy,
    resolving,
    resolve
  }
}
