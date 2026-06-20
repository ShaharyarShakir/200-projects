import { useAuthStore } from '../stores/auth.store';
import { ROLE_PERMISSIONS, type Permission } from '@bms/shared';

export function usePermissions() {
  const { user } = useAuthStore();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[user.role] ?? [];
    return permissions.includes(permission);
  };

  const hasAnyPermission = (...permissions: Permission[]): boolean =>
    permissions.some(hasPermission);

  const hasAllPermissions = (...permissions: Permission[]): boolean =>
    permissions.every(hasPermission);

  return { hasPermission, hasAnyPermission, hasAllPermissions, user };
}
