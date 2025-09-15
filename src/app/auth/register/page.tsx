'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signUpWithEmail, signInWithGoogle } from '@/lib/auth'
import { isValidEmail } from '@/lib/utils'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      setError('All fields are required')
      return false
    }

    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    return true
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validateForm()) return

    setLoading(true)

    try {
      await signUpWithEmail(
        formData.email,
        formData.password,
        { full_name: formData.fullName }
      )
      setSuccess(true)
    } catch (error: any) {
      setError(error.message || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle()
    } catch (error: any) {
      setError(error.message || 'Google sign up failed')
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-white">
        <div className="w-full max-w-md space-y-6 px-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Check your email</h1>
            <p className="text-gray-500 dark:text-gray-400">
              We've sent a confirmation link to {formData.email}.
            </p>
          </div>
          <Button onClick={() => router.push('/auth/login')}>
            Return to Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-white">
      <div className="w-full max-w-md space-y-6 px-4 text-center">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            Join Fanki
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Start your AI-powered learning journey
          </p>
        </header>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSignUp}>
          <div className="space-y-2">
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Full name"
              required
              value={formData.fullName}
              onChange={handleChange}
              className="w-full"
            />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email address"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full"
            />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Password (6+ characters)"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full"
            />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500 dark:bg-gray-950 dark:text-gray-400">
              Or continue with
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-2">
          <button onClick={handleGoogleSignUp} className="focus:outline-none">
            <svg
              className="h-24 w-24 text-gray-900" // Smaller icon for register page
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="sr-only">Continue with Google</span>
          </button>
          <span className="text-sm text-gray-600">Continue with Google</span>
        </div>
        
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold text-gray-900 underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
