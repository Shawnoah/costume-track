/**
 * Superadmin access control
 * Superadmins have elevated privileges across all organizations
 */

// Hardcoded superadmin emails (can also be set via SUPERADMIN_EMAILS env var)
const BUILTIN_SUPERADMIN_EMAILS = [
  "support@costumetrack.com",
];

/**
 * Check if an email address belongs to a superadmin
 */
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;

  const normalizedEmail = email.toLowerCase().trim();

  // Check built-in list
  if (BUILTIN_SUPERADMIN_EMAILS.includes(normalizedEmail)) {
    return true;
  }

  // Check environment variable (comma-separated list)
  const envAdmins = process.env.SUPERADMIN_EMAILS?.split(",").map(e => e.toLowerCase().trim()) || [];
  if (envAdmins.includes(normalizedEmail)) {
    return true;
  }

  return false;
}
