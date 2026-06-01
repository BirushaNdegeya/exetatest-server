const DEFAULT_ADMIN_EMAILS = ['birushandegeya@gmail.com'];

function normalizeEmail(email?: string | null): string {
  return email?.trim().toLowerCase() || '';
}

export function getConfiguredAdminEmails(adminEmailsConfig?: string): string[] {
  const configuredEmails = adminEmailsConfig
    ?.split(',')
    .map((email) => normalizeEmail(email))
    .filter(Boolean);

  if (configuredEmails && configuredEmails.length > 0) {
    return configuredEmails;
  }

  return DEFAULT_ADMIN_EMAILS;
}

export function isConfiguredAdminEmail(
  email?: string | null,
  adminEmailsConfig?: string,
): boolean {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return false;
  }

  return getConfiguredAdminEmails(adminEmailsConfig).includes(normalizedEmail);
}
