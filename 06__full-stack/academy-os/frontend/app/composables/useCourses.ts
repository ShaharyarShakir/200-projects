import type { Course } from '~/types/course'

export function useCourses() {
  const adminCourses = useState<Course[]>('admin-courses', () => [])
  const publicCourses = useState<Course[]>('public-courses', () => [])
  const isLoading = useState<boolean>('courses-is-loading', () => false)

  const { fetch: apiFetch } = useApi()

  function ensureAdminCoursesArray(): Course[] {
    if (!Array.isArray(adminCourses.value)) {
      adminCourses.value = []
    }
    return adminCourses.value
  }

  async function fetchAdminCourses() {
    isLoading.value = true
    try {
      const res = await apiFetch<any>('/api/courses')
      const coursesList = Array.isArray(res) ? res : (res?.courses || [])
      adminCourses.value = coursesList
      return adminCourses.value
    } catch (err) {
      console.error('Failed to fetch admin courses:', err)
      adminCourses.value = []
      return []
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPublicCourses(tenantSlug?: string) {
    isLoading.value = true
    try {
      const endpoint = tenantSlug
        ? `/api/public/tenants/${tenantSlug}/courses`
        : '/api/public/courses'
      const res = await apiFetch<any>(endpoint)
      const coursesList = Array.isArray(res) ? res : (res?.courses || [])
      publicCourses.value = coursesList
      return publicCourses.value
    } catch (err) {
      console.error('Failed to fetch public courses:', err)
      publicCourses.value = []
      return []
    } finally {
      isLoading.value = false
    }
  }

  async function createCourse(payload: { title: string; description: string }) {
    const newCourse = await apiFetch<Course>('/api/courses', {
      method: 'POST',
      body: payload
    })
    ensureAdminCoursesArray()
    if (newCourse) {
      adminCourses.value.unshift(newCourse)
    }
    return newCourse
  }

  async function publishCourse(courseId: string) {
    const updated = await apiFetch<Course>(`/api/courses/${courseId}/publish`, {
      method: 'POST'
    })
    ensureAdminCoursesArray()
    const idx = adminCourses.value.findIndex(c => c.id === courseId)
    if (idx !== -1 && updated) {
      adminCourses.value[idx] = updated
    }
    return updated
  }

  return {
    adminCourses,
    publicCourses,
    isLoading,
    fetchAdminCourses,
    fetchPublicCourses,
    createCourse,
    publishCourse
  }
}
