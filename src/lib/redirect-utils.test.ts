import { describe, it, expect, beforeEach } from 'vitest'
import { getSafeRedirectUrl, isValidRedirect } from './redirect-utils'

describe('Redirect Utils', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://fanki.app'
  })

  describe('URL Validation', () => {
    it('should validate internal URLs', () => {
      expect(isValidRedirect('/dashboard')).toBe(true)
      expect(isValidRedirect('/dashboard?tab=stats')).toBe(true)
    })

    it('should reject external URLs', () => {
      expect(isValidRedirect('https://evil.com/phishing')).toBe(false)
      expect(isValidRedirect('javascript:alert(1)')).toBe(false)
    })

    it('should allow same-origin absolute URLs', () => {
      expect(isValidRedirect('https://fanki.app/dashboard')).toBe(true)
      expect(isValidRedirect('https://fanki.app/settings?x=1')).toBe(true)
    })
  })

  describe('Safe Redirect', () => {
    it('should return safe URL', () => {
      expect(getSafeRedirectUrl('/dashboard')).toBe('/dashboard')
      expect(getSafeRedirectUrl('https://fanki.app/dashboard')).toBe('https://fanki.app/dashboard')
    })

    it('should default to fallback for unsafe URLs', () => {
      expect(getSafeRedirectUrl('https://evil.com', '/dashboard')).toBe('/dashboard')
    })

    it('should fallback to /dashboard when both url and fallback are unsafe', () => {
      expect(getSafeRedirectUrl('https://evil.com', 'https://other-evil.com')).toBe('/dashboard')
    })
  })
})
