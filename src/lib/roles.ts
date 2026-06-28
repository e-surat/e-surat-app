export const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
  { value: "officer", label: "Officer" },
  { value: "auditor", label: "Auditor" },
  { value: "ketua", label: "Ketua JaRI" },
  { value: "viewer", label: "Viewer" },
] as const;

export const ROLE_VALUES = ROLE_OPTIONS.map((r) => r.value);

export const ADMIN_ROLES = ["admin", "super_admin"];

export function roleLabel(value?: string | null): string {
  return ROLE_OPTIONS.find((r) => r.value === value)?.label ?? value ?? "-";
}

export function isAdminRole(value?: string | null): boolean {
  return ADMIN_ROLES.includes(value ?? "");
}
