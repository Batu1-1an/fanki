import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { getSafeRedirectUrl } from '@/lib/redirect-utils'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const redirectTo = requestUrl.searchParams.get('redirect_to')?.toString()

  const safeRedirectUrl = getSafeRedirectUrl(redirectTo, `${origin}/dashboard`)
  const redirectTarget = safeRedirectUrl.startsWith('/') ? `${origin}${safeRedirectUrl}` : safeRedirectUrl
  const response = NextResponse.redirect(redirectTarget)

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options) {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          },
          remove(name: string, options) {
            request.cookies.delete(name)
            response.cookies.delete(name)
          },
        },
      }
    )
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        response.headers.set('location', `${origin}/auth/login?error=${encodeURIComponent(error.message)}`)
      }
    } catch (error) {
      console.error('Auth callback exception:', error)
      response.headers.set('location', `${origin}/auth/login?error=Authentication failed`)
    }
  }

  return response
}
