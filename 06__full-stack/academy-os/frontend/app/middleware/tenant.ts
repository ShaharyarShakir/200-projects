import type { TenantMembership } from '~/types/tenant'

export default defineNuxtRouteMiddleware(async (to) => {
  const slug = to.params.tenantSlug as string

  if (!slug) {
    return
  }

  const { getTenants } = useTenantApi()

  try {
    const memberships = await getTenants()

    const tenantMembership = memberships.find(
      (m) => m.tenant.slug === slug
    )

    if (!tenantMembership) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Tenant not found'
      })
    }

    const { setTenant } = useTenant()
    setTenant(tenantMembership)
  } catch (err: any) {
    if (err?.statusCode === 404) {
      throw err
    }
    throw createError({
      statusCode: err?.statusCode || 404,
      statusMessage: err?.statusMessage || 'Tenant not found'
    })
  }
})
