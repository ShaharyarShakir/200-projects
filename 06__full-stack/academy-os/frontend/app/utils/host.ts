import { getRequestHeader } from 'h3'

export function getRequestHostname(
  event?: any
) {
  if (import.meta.server) {
    if (event) {
      try {
        const host = getRequestHeader(event, 'host')
        if (host) {
          return host.split(':')[0]
        }
      } catch {
        // Fallback to Nuxt request headers
      }
    }

    try {
      const headers = useRequestHeaders(['host'])
      if (headers.host) {
        return headers.host.split(':')[0]
      }
    } catch {
      // Fallback
    }
  }

  if (import.meta.client) {
    return window.location.hostname
  }

  return ''
}

export function getHostname(event?: any) {
  return getRequestHostname(event)
}

export function isAdminHost(hostname?: string) {
  if (!hostname) {
    return true
  }
  return (
    hostname === 'app.localhost' ||
    hostname === 'app.academyos.local' ||
    hostname === 'admin.localhost' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  )
}

export function getAcademyIdentifier(hostname: string) {
  if (hostname.endsWith('.academyos.local')) {
    return hostname.replace('.academyos.local', '')
  }
  if (hostname.endsWith('.localhost')) {
    return hostname.replace('.localhost', '')
  }

  return hostname
}
