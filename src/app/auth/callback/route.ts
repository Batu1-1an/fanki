import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { getSafeRedirectUrl } from '@/lib/redirect-utils'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const redirectTo = requestUrl.searchParams.get('redirect_to')?.toString()

  if (code) {
    const response = NextResponse.next()
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
        return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`)
      }
    } catch (error) {
      console.error('Auth callback exception:', error)
      return NextResponse.redirect(`${origin}/auth/login?error=Authentication failed`)
    }
  }

  // URL to redirect to after sign up process completes
  // Use secure redirect validation to prevent open redirect vulnerability
  const safeRedirectUrl = getSafeRedirectUrl(redirectTo, `${origin}/dashboard`)
  return NextResponse.redirect(safeRedirectUrl)
}
