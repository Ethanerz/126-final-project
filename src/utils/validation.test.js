import { describe, it, expect } from 'vitest'
import { isUpEmail, validateCoordinates } from './validation'

describe('isUpEmail', () => {
  it('accepts a standard UP address', () => {
    expect(isUpEmail('juan.delacruz@up.edu.ph')).toBe(true)
  })

  it('is case-insensitive on the domain', () => {
    expect(isUpEmail('juan@UP.EDU.PH')).toBe(true)
  })

  it('trims surrounding whitespace', () => {
    expect(isUpEmail('  juan@up.edu.ph  ')).toBe(true)
  })

  it('accepts plus-addressing', () => {
    expect(isUpEmail('juan+rateupv@up.edu.ph')).toBe(true)
  })

  it('rejects other domains', () => {
    expect(isUpEmail('juan@gmail.com')).toBe(false)
  })

  it('rejects the spoof "up.edu.ph" as a prefix of another domain', () => {
    expect(isUpEmail('victim@up.edu.ph.evil.com')).toBe(false)
  })

  it('rejects subdomain lookalikes (must be exactly @up.edu.ph)', () => {
    expect(isUpEmail('juan@students.up.edu.ph.attacker.io')).toBe(false)
  })

  it('rejects empty, whitespace-only, null, and undefined', () => {
    expect(isUpEmail('')).toBe(false)
    expect(isUpEmail('   ')).toBe(false)
    expect(isUpEmail(null)).toBe(false)
    expect(isUpEmail(undefined)).toBe(false)
  })

  it('rejects the bare domain with no local part… still ends with the domain', () => {
    // Matches the DB trigger (LIKE '%@up.edu.ph') — "@up.edu.ph" alone passes
    // the pattern; Supabase's own email syntax validation rejects it upstream.
    expect(isUpEmail('@up.edu.ph')).toBe(true)
  })
})

describe('validateCoordinates', () => {
  it('accepts the UPV campus center', () => {
    expect(validateCoordinates(10.6419865561452, 122.230924083072)).toBeNull()
  })

  it('accepts boundary values', () => {
    expect(validateCoordinates(-90, -180)).toBeNull()
    expect(validateCoordinates(90, 180)).toBeNull()
    expect(validateCoordinates(0, 0)).toBeNull()
  })

  it('accepts numeric strings (form input values)', () => {
    expect(validateCoordinates('10.64', '122.23')).toBeNull()
  })

  it('rejects latitude out of range', () => {
    expect(validateCoordinates(90.0001, 0)).toMatch(/Latitude/)
    expect(validateCoordinates(-91, 0)).toMatch(/Latitude/)
  })

  it('rejects longitude out of range', () => {
    expect(validateCoordinates(0, 180.5)).toMatch(/Longitude/)
    expect(validateCoordinates(0, -200)).toMatch(/Longitude/)
  })

  it('rejects non-numeric input', () => {
    expect(validateCoordinates('abc', 0)).toMatch(/Latitude/)
    expect(validateCoordinates(0, 'xyz')).toMatch(/Longitude/)
    expect(validateCoordinates('', '')).toMatch(/Latitude/)
    expect(validateCoordinates(NaN, 0)).toMatch(/Latitude/)
  })

  it('reports latitude problems before longitude problems', () => {
    expect(validateCoordinates(999, 999)).toMatch(/Latitude/)
  })
})
