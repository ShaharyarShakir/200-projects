import {
  getRequestHostname,
  isAdminHost
} from '~/utils/host'

export default defineNuxtPlugin(
  async () => {
    const event =
      import.meta.server
        ? useRequestEvent()
        : undefined

    const hostname =
      getRequestHostname(event)

    if (
      !hostname ||
      isAdminHost(hostname)
    ) {
      return
    }

    const {
      resolve
    } = useAcademyResolver()

    await resolve(hostname)
  }
)
