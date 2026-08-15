export default defineNuxtRouteMiddleware(async (to) => {
  const { resolveTenantForHost, isAdminHost } = useHostTenant()

  // If path starts with /t/[tenantSlug], resolve tenant by slug
  if (to.path.startsWith('/t/')) {
    const slug = (to.params.tenantSlug as string) || to.path.split('/')[2]
    if (slug && slug !== 'undefined') {
      await resolveTenantForHost(slug)
    }
    return
  }

  // If on a custom domain / subdomain host, resolve tenant for host
  if (!isAdminHost.value && !to.path.startsWith('/admin')) {
    await resolveTenantForHost()
  }
})
