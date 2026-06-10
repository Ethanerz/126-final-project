// Pure validation helpers, shared by forms and covered by unit tests.

// Mirror of the DB trigger (restrict_up_email_signups): the address must end
// in literally "@up.edu.ph". Anchored, so "user@up.edu.ph.evil.com" fails.
const UP_EMAIL_PATTERN = /@up\.edu\.ph$/i

export function isUpEmail(email) {
  return UP_EMAIL_PATTERN.test(String(email ?? '').trim())
}

// Returns an error message string, or null when the coordinates are valid.
export function validateCoordinates(latitude, longitude) {
  const lat = typeof latitude === 'number' ? latitude : parseFloat(latitude)
  const lng = typeof longitude === 'number' ? longitude : parseFloat(longitude)

  if (Number.isNaN(lat) || lat < -90 || lat > 90) {
    return 'Latitude must be a number between -90 and 90.'
  }
  if (Number.isNaN(lng) || lng < -180 || lng > 180) {
    return 'Longitude must be a number between -180 and 180.'
  }
  return null
}
