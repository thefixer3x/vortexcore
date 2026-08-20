export type Permission = 'read' | 'write' | 'admin';

export type UserRole = 'USER' | 'ADMIN';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  USER: ['read', 'write'],
  ADMIN: ['read', 'write', 'admin'],
};

export const ADMIN_PERMISSIONS: Permission[] = ['admin'];

export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.USER;
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return getPermissionsForRole(role).includes(permission);
}

export function isAdmin(role: UserRole): boolean {
  return role === 'ADMIN';
}
