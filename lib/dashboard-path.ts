/**
 * Role-to-dashboard path mapping. Safe to use in client components.
 */
const ROLE_DASHBOARD: Record<string, string> = {
  super_admin: "/super-admin/dashboard",
  admin: "/admin/dashboard",
  agency: "/agency/dashboard",
  volunteer: "/volunteer/dashboard",
};

export function getDashboardPathForRole(role: string | null | undefined): string | null {
  if (!role) return null;
  return ROLE_DASHBOARD[role] ?? null;
}
