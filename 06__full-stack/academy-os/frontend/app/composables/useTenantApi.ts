import type { TenantMembership } from '~/types/tenant'

export function useTenantApi() {
  const { fetch: apiFetch } = useApi()

  async function getTenants() {
    return await apiFetch<TenantMembership[]>('/api/me/tenants')
  }

  return {
    getTenants
  }
}
