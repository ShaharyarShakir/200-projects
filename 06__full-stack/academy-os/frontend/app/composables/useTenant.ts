import type { Academy } from '~/types/academy'

export interface TenantMembership {
  tenant: Academy
  role: string
}

export function useTenant() {
  const { academy, loading, error, setAcademy, clearAcademy, fetchMyAcademy, createAcademy } = useAcademy()

  const tenants = computed<TenantMembership[]>(() => {
    if (academy.value) {
      return [{ tenant: academy.value, role: 'owner' }]
    }
    return []
  })

  const currentTenant = computed(() => {
    if (!academy.value) return null
    return {
      id: academy.value.id,
      name: academy.value.name,
      slug: academy.value.slug,
      role: 'owner'
    }
  })

  async function fetchTenants() {
    const acad = await fetchMyAcademy()
    if (acad) {
      return [{ tenant: acad, role: 'owner' }]
    }
    return []
  }

  function selectTenant(val: any) {
    if (val?.tenant) {
      setAcademy(val.tenant)
    } else if (val?.slug) {
      setAcademy(val)
    }
  }

  async function createTenant(name: string, slug: string): Promise<TenantMembership> {
    const acad = await createAcademy(name, slug)
    return { tenant: acad, role: 'owner' }
  }

  return {
    tenant: academy,
    membership: computed(() => academy.value ? { tenant: academy.value, role: 'owner' } : null),
    tenants,
    currentTenant,
    isLoading: loading,
    error,
    setTenant: (val: any) => selectTenant(val),
    clearTenant: clearAcademy,
    fetchTenants,
    selectTenant,
    createTenant
  }
}
