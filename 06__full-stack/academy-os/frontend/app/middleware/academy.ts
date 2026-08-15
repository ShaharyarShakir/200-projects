import { getHostname, isAdminHost } from '~/utils/host'

export default defineNuxtRouteMiddleware(async (to) => {
  if ('academyID' in to.params) {
    const academyID = to.params.academyID
    if (!academyID) {
      return navigateTo('/dashboard')
    }
  }

  let hostname = getHostname()

  if (import.meta.server) {
    const headers = useRequestHeaders(['host'])
    const rawHost = headers.host || ''
    hostname = rawHost.split(':')[0].toLowerCase()
  }

  if (!hostname || isAdminHost(hostname)) {
    return
  }

  const { academy } = useAcademy()
  if (academy.value) {
    return
  }

  const { resolve } = useAcademyResolver()
  const resolved = await resolve(hostname)

  if (!resolved) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Academy not found'
    })
  }
})
