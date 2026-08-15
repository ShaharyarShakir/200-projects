export interface PublicAcademy {
  id: string
  name: string
  slug: string
  subdomain: string
  custom_domain: string | null
}

export function usePublicAcademy() {
  const academy = useState<PublicAcademy | null>('public-academy', () => {
    const currentAcad = useState<PublicAcademy | null>('current-academy', () => null)
    return currentAcad.value || null
  })

  const loading = useState<boolean>('public-academy-loading', () => false)
  const { fetch: apiFetch } = useApi()

  async function load() {
    if (academy.value) {
      return academy.value
    }

    const currentAcad = useState<PublicAcademy | null>('current-academy', () => null)
    if (currentAcad.value) {
      academy.value = currentAcad.value
      return academy.value
    }

    loading.value = true

    try {
      const response = await apiFetch<any>('/api/public/academy')
      const acad = response?.academy || response
      if (acad && (acad.id || acad.slug)) {
        academy.value = acad
        return academy.value
      }
    } catch (e) {
      // catch error
    } finally {
      loading.value = false
    }

    return null
  }

  return {
    academy,
    loading,
    load
  }
}
