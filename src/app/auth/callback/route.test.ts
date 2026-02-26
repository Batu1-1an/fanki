import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'
import { createServerClient } from '@supabase/ssr'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn()
}))

describe('Auth Callback Route', () => {
  const createServerClientMock = vi.mocked(createServerClient)

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
  })

  describe('GET /auth/callback', () => {
    it('returns redirect with auth cookie when code exchange succeeds', async () => {
      createServerClientMock.mockImplementation((_, __, options: any) => ({
        auth: {
          exchangeCodeForSession: vi.fn(async () => {
            options.cookies.set('sb-auth-token', 'token-value', { path: '/' })
            return { error: null }
          })
        }
      }) as any)

      const request = new NextRequest('http://localhost:3000/auth/callback?code=auth_code_123&redirect_to=/settings')
      const response = await GET(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/settings')
      expect(response.headers.get('set-cookie')).toContain('sb-auth-token=token-value')
    })

    it('falls back to dashboard when redirect_to is unsafe', async () => {
      createServerClientMock.mockImplementation((_, __, _options: any) => ({
        auth: {
          exchangeCodeForSession: vi.fn(async () => ({ error: null }))
        }
      }) as any)

      const request = new NextRequest('http://localhost:3000/auth/callback?code=abc123&redirect_to=https://evil.com')
      const response = await GET(request)

      expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
    })

    it('redirects to login with encoded error on exchange failure', async () => {
      createServerClientMock.mockImplementation((_, __, _options: any) => ({
        auth: {
          exchangeCodeForSession: vi.fn(async () => ({ error: { message: 'invalid code' } }))
        }
      }) as any)

      const request = new NextRequest('http://localhost:3000/auth/callback?code=abc123')
      const response = await GET(request)

      expect(response.headers.get('location')).toBe('http://localhost:3000/auth/login?error=invalid%20code')
    })

    it('redirects to dashboard when code is missing', async () => {
      const request = new NextRequest('http://localhost:3000/auth/callback')
      const response = await GET(request)

      expect(createServerClientMock).not.toHaveBeenCalled()
      expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
    })
  })
})
