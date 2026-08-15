import type { Tenant } from '~/types/tenant'

export interface PublicTenantDetails extends Tenant {
  primary_color?: string
  secondary_color?: string
  description?: string
  logo_url?: string
}

export function useHostTenant() {
  const publicTenant = useState<PublicTenantDetails | null>('public-host-tenant', () => null)
  const isResolving = useState<boolean>('host-tenant-is-resolving', () => false)

  const { fetch: apiFetch } = useApi()

  function getHost(): string {
    if (import.meta.server) {
      const headers = useRequestHeaders(['host'])
      return headers.host || ''
    }
    return window.location.host
  }

  const host = computed(() => getHost())

  const isAdminHost = computed(() => {
    const currentHost = host.value.toLowerCase()
    return (
      currentHost.startsWith('app.') ||
      currentHost.startsWith('admin.') ||
      currentHost.startsWith('localhost') ||
      currentHost.startsWith('127.0.0.1') ||
      currentHost === 'app.academyos.com'
    )
  })

  async function resolveTenantForHost(overrideSlugOrHost?: string): Promise<PublicTenantDetails | null> {
    isResolving.value = true
    try {
      const target = overrideSlugOrHost || host.value
      const isSlug = !target.includes('.') && !target.includes(':')
      const queryParam = isSlug ? `slug=${encodeURIComponent(target)}` : `host=${encodeURIComponent(target)}`

      const res = await apiFetch<any>(`/api/public/tenants/resolve?${queryParam}`)
      const tenantData = res?.tenant || res
      publicTenant.value = tenantData
      return tenantData
    } catch (e) {
      publicTenant.value = null
      return null
    } finally {
      isResolving.value = false
    }
  }

  return {
    host,
    isAdminHost,
    publicTenant,
    isResolving,
    resolveTenantForHost
  }
}
