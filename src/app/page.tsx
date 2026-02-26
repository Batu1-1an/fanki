import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarClock,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Layers,
  Mic,
  Shuffle,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'

const primaryNav = [
  { label: 'Features', href: '#features' },
  { label: 'FAQ', href: '#faq' },
]

const heroHighlights = [
  'SM-2 algorithm adapts to your learning pace and optimizes review timing',
  'AI generates contextual sentences, pronunciation audio, and relevant images',
  'Multiple card types: Basic, Cloze deletion, Typing, and Reverse cards',
]

const features = [
  {
    title: 'AI-Generated Flashcards',
    description:
      'Automatically generate contextual example sentences, pronunciation audio, and relevant images using AI.',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Scientific Scheduling',
    description: 'SM-2 spaced repetition algorithm optimizes review timing based on your performance.',
    icon: CalendarClock,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Multiple Card Types',
    description: 'Basic cards, cloze deletions, typing practice, and reverse cards for flexible learning.',
    icon: Layers,
    color: 'from-orange-500 to-red-500',
  },
  {
    title: 'Smart Study Modes',
    description: 'Choose from shuffled, oldest first, easiest first, or hardest first sorting strategies.',
    icon: Shuffle,
    color: 'from-green-500 to-emerald-500',
  },
  {
    title: 'Desk Organization',
    description: 'Organize your cards into custom desks (decks) and filter study sessions by topic.',
    icon: BookOpen,
    color: 'from-indigo-500 to-purple-500',
  },
  {
    title: 'Progress Tracking',
    description: 'Detailed statistics, learning streaks, and retention analytics to monitor your progress.',
    icon: Target,
    color: 'from-yellow-500 to-orange-500',
  },
]

const faqs = [
  {
    question: 'How does the AI generate flashcards?',
    answer:
      'Fanki uses Google Gemini to generate contextual example sentences, ElevenLabs for natural pronunciation audio, and Unsplash for relevant images. Each flashcard is enriched with multiple AI services to provide comprehensive learning context.',
  },
  {
    question: 'What is the SM-2 algorithm?',
    answer:
      'SM-2 is a proven spaced repetition algorithm from SuperMemo that schedules reviews at optimal intervals. Cards you find easy appear less frequently, while difficult cards are reviewed more often. The algorithm adapts to your individual performance.',
  },
  {
    question: 'What card types are supported?',
    answer:
      'Fanki supports Basic cards (front/back), Cloze deletion (fill-in-the-blank), Typing cards (requires exact spelling), and Reverse cards (creates bidirectional flashcards). Each type is optimized for different learning scenarios.',
  },
  {
    question: 'Can I organize my cards?',
    answer:
      'Yes! Use Desks (decks) to organize cards by topic. You can create unlimited desks, assign cards to multiple desks, and filter study sessions by desk. This helps you focus on specific subjects.',
  },
  {
    question: 'How do study modes work?',
    answer:
      'Choose from Recommended (shuffled variety), Oldest First (tackle overdue cards), Easiest First (build momentum), or Hardest First (challenge mode). The algorithm maintains SM-2 scheduling while providing strategic flexibility.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Your data is stored securely with Supabase, using row-level security policies. All data is encrypted in transit and at rest. You can export your data at any time in JSON or CSV format.',
  },
]

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-[1.02]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Fanki</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 lg:flex">
            {primaryNav.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden text-slate-200 hover:text-white lg:inline-flex" asChild>
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button
              className="hidden rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-6 font-semibold text-white hover:from-orange-600 hover:to-pink-600 lg:inline-flex"
              asChild
            >
              <Link href="/auth/register">Sign Up</Link>
            </Button>
          </div>
        </div>
        <details className="border-t border-white/10 bg-slate-950/95 lg:hidden">
          <summary className="list-none cursor-pointer px-4 py-3 text-sm font-medium text-slate-200">
            Menu
          </summary>
          <div className="container mx-auto space-y-4 px-4 py-4">
            <div className="flex flex-col gap-3">
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-slate-200 transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="ghost" className="text-slate-200 hover:text-white" asChild>
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button
                className="rounded-full bg-gradient-to-r from-orange-500 to-pink-500 font-semibold text-white"
                asChild
              >
                <Link href="/auth/register">Sign Up</Link>
              </Button>
            </div>
          </div>
        </details>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 pb-20 pt-24 sm:pt-32" id="hero">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.3),transparent_50%)] opacity-60"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(236,72,153,0.2),transparent_50%)]"></div>
          
          <div className="container relative z-10 mx-auto">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
                Master New Languages with{' '}
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  AI-Driven Flashcards
                </span>
              </h1>
              <p className="mt-6 text-lg text-slate-300 sm:text-xl">
                Experience personalized learning with the SM-2 spaced repetition algorithm, AI-generated content, and intelligent practice modes.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="group rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-8 py-6 text-lg font-semibold text-white shadow-lg hover:from-orange-600 hover:to-pink-600"
                  asChild
                >
                  <Link href="/auth/register">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-2 border-white/20 bg-white/5 px-8 py-6 text-lg font-semibold text-white backdrop-blur hover:bg-white/10"
                  asChild
                >
                  <Link href="#features">See Features</Link>
                </Button>
              </div>
              <ul className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-300">
                {heroHighlights.map((highlight) => (
                  <li key={highlight} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hero Visual */}
            <div className="mx-auto mt-16 max-w-5xl">
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 blur-3xl"></div>
                <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
                  <div className="flex items-center justify-between border-b border-white/10 pb-6">
                    <div>
                      <p className="text-sm font-semibold text-white">Study Session</p>
                      <p className="text-xs text-slate-400">15 cards ready for review</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3 py-1.5">
                      <Sparkles className="h-4 w-4 text-purple-300" />
                      <span className="text-xs font-medium text-purple-200">AI Powered</span>
                    </div>
                  </div>
                  <div className="mt-8 grid gap-6 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                      <div className="mb-4 flex items-center gap-2">
                        <Brain className="h-5 w-5 text-blue-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">Vocabulary</span>
                      </div>
                      <p className="text-lg font-medium text-white">ephemeral</p>
                      <p className="mt-2 text-sm text-slate-400">lasting for a very short time</p>
                      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                        <Mic className="h-3 w-3" />
                        <span>Audio available</span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                      <div className="mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">Context</span>
                      </div>
                      <p className="text-sm italic text-slate-300">
                        &ldquo;The beauty of a sunset is ephemeral, lasting only a few precious minutes.&rdquo;
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                        <ImageIcon className="h-3 w-3" />
                        <span>AI-generated content</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative overflow-hidden bg-white px-4 py-20">
          <div className="container mx-auto">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                Features
              </div>
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
                Built for outcomes, not vanity metrics.
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                All the features you need to master any language with scientifically proven methods.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl"
                  >
                    <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="mb-3 text-xl font-semibold text-slate-900">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>


        <section id="faq" className="relative overflow-hidden bg-slate-100 py-20 text-slate-900">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                FAQ
              </p>
              <h2 className="mt-6 text-3xl font-semibold sm:text-4xl">Frequently Asked Questions</h2>
              <p className="mt-4 text-base text-slate-600">
                Everything you need to know about Fanki&apos;s features and how it works.
              </p>
            </div>
            <div className="mt-12 grid gap-4">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-lg transition-all duration-200 open:border-slate-300"
                >
                  <summary className="flex cursor-pointer items-center justify-between text-left text-base font-semibold text-slate-900">
                    {faq.question}
                    <span className="ml-4 text-xs font-semibold uppercase tracking-[0.35em] text-slate-400 group-open:text-slate-600">
                      View
                    </span>
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 px-4 py-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.2),transparent_70%)]"></div>
          <div className="container relative z-10 mx-auto text-center">
            <div className="mx-auto max-w-3xl space-y-8">
              <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                Ready to master a new language?
              </h2>
              <p className="text-lg text-slate-300">
                Start learning with AI-powered flashcards and scientifically proven spaced repetition. No credit card required.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-8 py-6 text-lg font-semibold text-white shadow-lg hover:from-orange-600 hover:to-pink-600"
                  asChild
                >
                  <Link href="/auth/register">Start Free Trial</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-2 border-white/20 bg-white/5 px-8 py-6 text-lg font-semibold text-white backdrop-blur hover:bg-white/10"
                  asChild
                >
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/60 bg-slate-950 py-12">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Fanki</span>
            </Link>
            <p className="text-sm text-slate-400">
              Modern flashcard learning with AI-powered content generation and scientific spaced repetition.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span>© {new Date().getFullYear()} Fanki</span>
            </div>
          </div>
          <div className="grid gap-6 text-sm text-slate-300 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Product</p>
              <Link href="#features" className="block text-slate-300 transition-colors hover:text-white">
                Features
              </Link>
              <Link href="#faq" className="block text-slate-300 transition-colors hover:text-white">
                FAQ
              </Link>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Get Started</p>
              <Link href="/auth/register" className="block text-slate-300 transition-colors hover:text-white">
                Sign Up
              </Link>
              <Link href="/auth/login" className="block text-slate-300 transition-colors hover:text-white">
                Log In
              </Link>
              <Link href="/dashboard" className="block text-slate-300 transition-colors hover:text-white">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
