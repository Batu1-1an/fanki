import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton pattern for client-side Supabase client
let clientInstance: ReturnType<typeof createBrowserClient> | null = null

// Client-side Supabase client
export const createClientComponentClient = () => {
  if (typeof window === 'undefined') {
    // Server-side, always create new instance
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  
  if (!clientInstance) {
    clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  
  return clientInstance
}

// Server-side Supabase client for Server Components
export const createServerComponentClient = async () => {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// Legacy client for backwards compatibility
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
