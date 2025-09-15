import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-2xl font-bold">
            Fanki
          </Link>
          <div className="space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            AI-Powered Flashcards
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
            Transform your language learning with AI-generated flashcards, spaced repetition, and multi-modal learning experiences.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild>
              <Link href="/auth/register">Start Learning Free</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto space-y-20 px-4 py-16">
          <div className="flex flex-col items-center space-y-4 text-center">
            <Icons.lightbulb className="h-24 w-24" />
            <h2 className="text-2xl font-bold">AI-Generated Content</h2>
            <p className="max-w-md text-gray-500">
              Dynamic sentences, memorable images, and audio pronunciation powered by advanced AI.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4 text-center">
            <Icons.clock className="h-24 w-24" />
            <h2 className="text-2xl font-bold">Spaced Repetition</h2>
            <p className="max-w-md text-gray-500">
              SM-2 algorithm optimizes your learning schedule for maximum retention.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4 text-center">
            <Icons.barChart className="h-24 w-24" />
            <h2 className="text-2xl font-bold">Progress Tracking</h2>
            <p className="max-w-md text-gray-500">
              Detailed analytics, streaks, and achievements to keep you motivated.
            </p>
          </div>
        </section>

        {/* Implementation Status Section */}
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold">Implementation Status</h2>
            <div className="mx-auto mt-8 inline-flex flex-col items-start space-y-4">
              <p className="flex items-center text-gray-600">
                <span className="mr-2 text-green-500">✅</span>
                Supabase database setup
              </p>
              <p className="flex items-center text-gray-600">
                <span className="mr-2 text-green-500">✅</span>
                Next.js project initialized
              </p>
              <p className="flex items-center text-gray-600">
                <span className="mr-2 text-green-500">✅</span>
                Authentication UI created
              </p>
              <p className="flex items-center text-gray-600">
                <span className="mr-2 text-yellow-500">🔧</span>
                Google OAuth setup needed
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-500">
        <p>&copy; 2024 Fanki. AI-powered language learning made simple.</p>
      </footer>
    </div>
  )
}