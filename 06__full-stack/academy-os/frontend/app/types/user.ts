export type UserRole = 'PLATFORM_ADMIN' | 'INSTRUCTOR' | 'STUDENT'

export interface User {
  id: string
  email: string
  name?: string
  role?: UserRole
}
