import type { Academy } from '~/types/academy'

export function useAcademy() {
  const academy = useState<Academy | null>(
    'current-academy',
    () => null
  )

  const loading = useState<boolean>(
    'current-academy-loading',
    () => false
  )

  const isResolved = useState<boolean>(
    'academy-resolved',
    () => false
  )

  const error = useState<string | null>(
    'academy-error',
    () => null
  )

  const { fetch: apiFetch } = useApi()

  function setAcademy(value: Academy) {
    academy.value = value
    isResolved.value = true
  }

  function clearAcademy() {
    academy.value = null
    isResolved.value = false
  }

  async function fetchMyAcademy(): Promise<Academy | null> {
    loading.value = true
    error.value = null
    try {
      const data = await apiFetch<any>('/api/academy')
      const acad = data?.academy || data
      if (acad && (acad.id || acad.slug)) {
        setAcademy(acad)
        return acad
      }
      return null
    } catch (err: any) {
      error.value = err?.data?.message || err?.message || 'Failed to fetch academy'
      return null
    } finally {
      loading.value = false
    }
  }

  async function createAcademy(name: string, slug: string): Promise<Academy> {
    loading.value = true
    error.value = null
    try {
      const data = await apiFetch<any>('/api/academies', {
        method: 'POST',
        body: { name, slug }
      })
      const acad = data?.academy || data
      setAcademy(acad)
      return acad
    } catch (err: any) {
      const msg = err?.data || err?.message || 'Failed to create academy'
      error.value = typeof msg === 'string' ? msg : JSON.stringify(msg)
      throw new Error(error.value || 'Failed to create academy')
    } finally {
      loading.value = false
    }
  }

  return {
    academy,
    loading,
    isResolved,
    error,
    setAcademy,
    clearAcademy,
    fetchMyAcademy,
    createAcademy
  }
}
