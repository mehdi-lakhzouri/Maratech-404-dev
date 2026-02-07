/**
 * User roles enum
 */
export enum UserRole {
  RESPONSABLE = 'RESPONSABLE',
  CHEF_PROJET = 'CHEF_PROJET',
  CONSULTANT = 'CONSULTANT',
}

/**
 * Role hierarchy for permission checks
 */
export const RoleHierarchy: Record<UserRole, number> = {
  [UserRole.RESPONSABLE]: 3,
  [UserRole.CHEF_PROJET]: 2,
  [UserRole.CONSULTANT]: 1,
};

/**
 * Check if a role has at least the required role level
 */
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return RoleHierarchy[userRole] >= RoleHierarchy[requiredRole];
}
