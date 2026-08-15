export function usePermissions() {
  const { user } = useAuth()

  const isPlatformAdmin = computed(() => user.value?.role === 'PLATFORM_ADMIN')
  const isInstructor = computed(() => user.value?.role === 'INSTRUCTOR' || isPlatformAdmin.value)

  const canManageCourses = computed(() => isInstructor.value)
  const canManageAcademy = computed(() => isInstructor.value)

  return {
    isPlatformAdmin,
    isInstructor,
    canManageCourses,
    canManageAcademy,
    canManageTenant: canManageAcademy
  }
}
