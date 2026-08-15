import type { User } from '~/types/user'

interface AuthResponse {
  user: User
}

export function useAuth() {
  const user = useState<User | null>('auth-user', () => null)
  const initialized = useState('auth-initialized', () => false)
  const loading = useState('auth-loading', () => false)
  const error = useState<string | null>('auth-error', () => null)

  const { fetch: apiFetch } = useApi()

  async function fetchUser(force = false) {
    if (initialized.value && !force && user.value) {
      return
    }

    loading.value = true

    try {
      const response = await apiFetch<AuthResponse>('/api/auth/me')
      user.value = response.user
    } catch {
      user.value = null
    } finally {
      initialized.value = true
      loading.value = false
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const response = await apiFetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: {
          email,
          password
        }
      })

      user.value = response.user
      return response.user
    } catch (err: any) {
      error.value = err?.data?.error || err?.message || 'Unable to log in.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function signup(name: string, email: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const response = await apiFetch<AuthResponse>('/api/auth/signup', {
        method: 'POST',
        body: {
          name,
          email,
          password
        }
      })

      user.value = response.user
      return response.user
    } catch (err: any) {
      error.value = err?.data?.error || err?.message || 'Unable to create your account.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true

    try {
      await apiFetch('/api/auth/logout', {
        method: 'POST'
      })
    } catch {
      // Ignore logout errors
    } finally {
      user.value = null
      loading.value = false
    }
  }

  return {
    user,
    initialized,
    loading,
    error,
    fetchUser,
    login,
    signup,
    logout
  }
}
