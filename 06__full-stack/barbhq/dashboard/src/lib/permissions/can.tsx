import React from "react";
import type { Permission, Role } from "./permissions";
import { ROLE_PERMISSIONS } from "./role-permissions";

export interface UserLike {
  role?: string | Role;
  permissions?: Permission[];
}

export function can(user: UserLike | null | undefined, permission: Permission): boolean {
  if (!user || !user.role) return false;
  const role = user.role.toUpperCase() as Role;
  const granted = ROLE_PERMISSIONS[role];
  if (!granted) return false;
  return granted.includes(permission);
}

export interface CanProps {
  user?: UserLike | null;
  perform: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ user, perform, children, fallback = null }) => {
  if (!user || !can(user, perform)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
};
