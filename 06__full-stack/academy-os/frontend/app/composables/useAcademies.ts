export interface Academy {
  id: string
  name: string
  slug: string
  status?: string
}

export function useAcademies() {
  const academies = useState<Academy[]>('academies', () => [])
  const loading = useState<boolean>('academies-loading', () => false)

  const api = useApi()

  async function fetchAcademies() {
    loading.value = true

    try {
      const res = await api.request<any>('/api/tenants')
      const items = Array.isArray(res) ? res : res?.academies || res?.tenants || []

      academies.value = items.map((item: any) => ({
        id: item.id || item.tenant?.id || item.tenant_id || '',
        name: item.name || item.tenant?.name || item.tenant_name || '',
        slug: item.slug || item.tenant?.slug || item.tenant_slug || '',
        status: item.status || 'active'
      }))
      return academies.value
    } catch (err) {
      console.error('Failed to fetch academies:', err)
      academies.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    academies,
    loading,
    fetchAcademies
  }
}
