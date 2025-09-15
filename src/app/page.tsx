import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Lightbulb, Clock, BarChart, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-2xl font-bold">Fanki</span>
          </Link>
          <div className="space-x-2">
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
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 lg:py-40">
          <div
            aria-hidden="true"
            className="absolute inset-0 top-0 z-0 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"
          ></div>
          <div className="container relative z-10 mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Smarter Flashcards for Serious Learners
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
              Transform your vocabulary with AI-generated content, proven spaced repetition, and a learning experience designed to be effective, not addictive.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/auth/register">Start Learning for Free</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 sm:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold sm:text-4xl">Why Fanki Works</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                We combine cutting-edge AI with proven learning science to maximize your retention.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-8 text-center shadow-sm">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Lightbulb className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold">AI-Generated Content</h3>
                <p className="text-muted-foreground">
                  Dynamic sentences, memorable images, and audio pronunciation powered by advanced AI to create rich, contextual flashcards.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-8 text-center shadow-sm">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Clock className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold">Spaced Repetition</h3>
                <p className="text-muted-foreground">
                  Our implementation of the SM-2 algorithm optimizes your review schedule, showing you cards right before you forget them.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-8 text-center shadow-sm">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <BarChart className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold">Progress Tracking</h3>
                <p className="text-muted-foreground">
                  Detailed analytics, study streaks, and achievements keep you motivated and provide insight into your learning journey.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-3xl font-extrabold sm:text-4xl">Ready to Start Learning?</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Create your free account today and experience a more effective way to build your vocabulary.
              </p>
              <div className="mt-8">
                <Button size="lg" asChild>
                  <Link href="/auth/register">Sign Up Now</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Fanki. AI-powered language learning made simple.</p>
        </div>
      </footer>
    </div>
  )
}