import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set(name, value, options)
          requestHeaders.set('cookie', response.cookies.toString())
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...(options ?? {}),
            maxAge: 0,
          })
          requestHeaders.set('cookie', response.cookies.toString())
        },
      },
    }
  )

  // Refresh session and verify user with Auth service
  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isProtectedRoute = [
    '/dashboard',
    '/study',
    '/settings',
    '/profile'
  ].some(route => request.nextUrl.pathname.startsWith(route))
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/callback')

  // Redirect authenticated users away from auth pages
  if (user && isAuthPage && !isAuthCallback) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect unauthenticated users to login
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/study/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/auth/:path*',
  ],
}
