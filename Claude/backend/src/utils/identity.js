// Normalizes an email or CNIC into a consistent key so the same person
// can be recognized across claims even if formatting differs slightly
// (e.g. "12345-1234567-1" vs "1234512345671", or email casing).

export function normalizeIdentity(identityType, identityValue) {
  const value = String(identityValue || "").trim();

  if (identityType === "CNIC") {
    // Strip dashes/spaces so "12345-1234567-1" and "1234512345671" match.
    return value.replace(/[\s-]/g, "");
  }

  // EMAIL
  return value.toLowerCase();
}

export function isValidCnic(value) {
  const digitsOnly = String(value || "").replace(/[\s-]/g, "");
  return /^\d{13}$/.test(digitsOnly);
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}
