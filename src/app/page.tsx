import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Lightbulb, Clock, BarChart, Zap, Brain, Sparkles, TrendingUp, Users, ChevronRight, Star } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50 text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2 transition-transform hover:scale-105">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Fanki</span>
          </Link>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" className="hover:bg-blue-50" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200" asChild>
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 md:py-32 lg:py-40">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-pink-400/20 to-blue-400/20 blur-3xl animate-pulse delay-1000"></div>
          </div>
          
          {/* Grid pattern overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"
          ></div>
          
          <div className="container relative z-10 mx-auto px-4 text-center">
            <div className="mb-6 inline-flex items-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 text-sm font-medium text-blue-800">
              <Sparkles className="mr-2 h-4 w-4" />
              AI-Powered Language Learning
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Master Languages
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                The Smart Way
              </span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-600 md:text-xl leading-relaxed">
              Transform your vocabulary with AI-generated content, proven spaced repetition, and a learning experience designed to be <span className="font-semibold text-blue-600">effective, not addictive</span>.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 text-lg px-8 py-3" asChild>
                <Link href="/auth/register" className="flex items-center">
                  Start Learning for Free
                  <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-2 hover:bg-blue-50 text-lg px-8 py-3" asChild>
                <Link href="#features">See How It Works</Link>
              </Button>
            </div>
            
            {/* Social proof */}
            <div className="mt-12 flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>1000+ learners</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400" />
                <span>4.9/5 rating</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4" />
                <span>95% retention rate</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 sm:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="text-3xl font-bold sm:text-4xl bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                Why Fanki Works
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                We combine cutting-edge AI with proven learning science to maximize your retention.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="relative z-10">
                  <div className="mb-6 flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg">
                    <Brain className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">AI-Generated Content</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Dynamic sentences, memorable images, and audio pronunciation powered by advanced AI to create rich, contextual flashcards.
                  </p>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="relative z-10">
                  <div className="mb-6 flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-blue-500 text-white shadow-lg">
                    <Clock className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Spaced Repetition</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Our implementation of the SM-2 algorithm optimizes your review schedule, showing you cards right before you forget them.
                  </p>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="relative z-10">
                  <div className="mb-6 flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                    <BarChart className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Progress Tracking</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Detailed analytics, study streaks, and achievements keep you motivated and provide insight into your learning journey.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-16 sm:py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-3xl font-bold sm:text-4xl text-white mb-6">
                Ready to Start Learning?
              </h2>
              <p className="text-xl text-blue-100 mb-10 leading-relaxed">
                Create your free account today and experience a more effective way to build your vocabulary.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-200 text-lg px-8 py-3 font-semibold" asChild>
                  <Link href="/auth/register">Sign Up Now</Link>
                </Button>
                <Button variant="outline" size="lg" className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-8 py-3" asChild>
                  <Link href="/auth/login">Already have an account?</Link>
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