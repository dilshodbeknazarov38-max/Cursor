export const ROLE_ROUTE_MAP: Record<string, string> = {
  SUPER_ADMIN: "superadmin",
  ADMIN: "admin",
  TARGET_ADMIN: "target-admin",
  OPER_ADMIN: "oper-admin",
  SKLAD_ADMIN: "sklad-admin",
  TAMINOTCHI: "taminotchi",
  TARGETOLOG: "targetolog",
  OPERATOR: "operator",
};

export const DEFAULT_ROLE_SLUG = "TARGETOLOG";

const ROLE_NAME_FALLBACK: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  TARGET_ADMIN: "Target Admin",
  OPER_ADMIN: "Oper Admin",
  SKLAD_ADMIN: "Sklad Admin",
  TAMINOTCHI: "Ta’minotchi",
  TARGETOLOG: "Targetolog",
  OPERATOR: "Operator",
};

export function normalizeRoleSlug(roleSlug?: string | null): string {
  const normalized = (roleSlug ?? DEFAULT_ROLE_SLUG)
    .toString()
    .trim()
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .toUpperCase();
  return ROLE_ROUTE_MAP[normalized] ? normalized : DEFAULT_ROLE_SLUG;
}

export function getDashboardPathFromRole(roleSlug?: string | null): string {
  const slug = normalizeRoleSlug(roleSlug);
  return ROLE_ROUTE_MAP[slug] ?? ROLE_ROUTE_MAP[DEFAULT_ROLE_SLUG];
}

export function getRoleNameFromSlug(roleSlug?: string | null): string {
  const slug = normalizeRoleSlug(roleSlug);
  return ROLE_NAME_FALLBACK[slug] ?? ROLE_NAME_FALLBACK[DEFAULT_ROLE_SLUG];
}
