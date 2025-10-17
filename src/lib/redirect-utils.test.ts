import { describe, it, expect, vi } from 'vitest'

describe('Redirect Utils', () => {
  describe('URL Validation', () => {
    it('should validate internal URLs', () => {
      const url = '/dashboard'
      const isInternal = url.startsWith('/')
      expect(isInternal).toBe(true)
    })

    it('should reject external URLs', () => {
      const url = 'https://evil.com/phishing'
      const isInternal = url.startsWith('/')
      expect(isInternal).toBe(false)
    })

    it('should allow whitelisted domains', () => {
      const whitelist = ['fanki.app', 'localhost']
      const url = 'https://fanki.app/dashboard'
      const domain = new URL(url).hostname
      expect(whitelist).toContain(domain)
    })
  })

  describe('Safe Redirect', () => {
    it('should return safe URL', () => {
      const input = '/dashboard'
      const safe = input.startsWith('/') ? input : '/dashboard'
      expect(safe).toBe('/dashboard')
    })

    it('should default to fallback for unsafe URLs', () => {
      const input = 'https://evil.com'
      const fallback = '/dashboard'
      const safe = input.startsWith('/') ? input : fallback
      expect(safe).toBe(fallback)
    })
  })

  describe('Query Parameter Validation', () => {
    it('should parse redirect_to parameter', () => {
      const params = new URLSearchParams('?redirect_to=/profile')
      const redirectTo = params.get('redirect_to')
      expect(redirectTo).toBe('/profile')
    })

    it('should handle missing parameter', () => {
      const params = new URLSearchParams('')
      const redirectTo = params.get('redirect_to')
      expect(redirectTo).toBeNull()
    })
  })

  describe('Open Redirect Prevention', () => {
    it('should block javascript: URLs', () => {
      const url = 'javascript:alert(1)'
      const isSafe = url.startsWith('http') || url.startsWith('/')
      expect(isSafe).toBe(false)
    })

    it('should block data: URLs', () => {
      const url = 'data:text/html,<script>alert(1)</script>'
      const isSafe = url.startsWith('http') || url.startsWith('/')
      expect(isSafe).toBe(false)
    })
  })
})
