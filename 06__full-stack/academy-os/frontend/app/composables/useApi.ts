export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || 'http://localhost:8080'
  const currentTenantState = useState<any>('current-tenant', () => null)

  async function request<T>(
    url: string,
    options: any = {}
  ) {
    const fullUrl = url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `${baseURL}${url.startsWith('/') ? '' : '/'}${url}`

    const headers: Record<string, string> = {
      ...(options.headers || {})
    }

    if (currentTenantState.value?.id && !headers['X-Tenant-ID']) {
      headers['X-Tenant-ID'] = currentTenantState.value.id
    }

    if (import.meta.server) {
      const reqHeaders = useRequestHeaders(['cookie', 'host'])
      if (reqHeaders.cookie && !headers.cookie) {
        headers.cookie = reqHeaders.cookie
      }
      if (reqHeaders.host && !headers.host) {
        headers.host = reqHeaders.host
      }
    } else if (import.meta.client && !headers.host && window.location.host) {
      headers.host = window.location.host
    }

    return await $fetch<T>(
      fullUrl,
      {
        ...options,
        headers,
        credentials: 'include'
      }
    )
  }

  return {
    request,
    fetch: request,
    baseURL
  }
}

