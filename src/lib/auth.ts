import { createClientComponentClient } from '@/lib/supabase/client'
import { type User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

/**
 * Get the current user from the session (client-side)
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabaseClient = createClientComponentClient()
  const { data: { session } } = await supabaseClient.auth.getSession()
  return session?.user || null
}

/**
 * Get the current user from the session (server-side)
 */
export async function getCurrentUserServer(): Promise<User | null> {
  const { createServerComponentClient } = await import('@/lib/supabase/server')
  const supabaseClient = await createServerComponentClient()
  const { data: { user }, error } = await supabaseClient.auth.getUser()

  if (error) {
    return null
  }

  return user
}

/**
 * Require authentication on server-side
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUserServer()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  return user
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const supabaseClient = createClientComponentClient()
  
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string, 
  password: string, 
  metadata?: { full_name?: string }
) {
  const supabaseClient = createClientComponentClient()
  
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: metadata || {},
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw error
  }

  return data
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  const supabaseClient = createClientComponentClient()
  
  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw error
  }

  return data
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabaseClient = createClientComponentClient()
  
  const { error } = await supabaseClient.auth.signOut()
  
  if (error) {
    throw error
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  const supabaseClient = createClientComponentClient()
  
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (error) {
    throw error
  }
}

/**
 * Update password
 */
export async function updatePassword(password: string) {
  const supabaseClient = createClientComponentClient()
  
  const { error } = await supabaseClient.auth.updateUser({ password })

  if (error) {
    throw error
  }
}
