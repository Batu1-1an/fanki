'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowUpRight,
  BarChart3,
  Brain,
  CalendarClock,
  CheckCircle2,
  Clock,
  Layers,
  LineChart,
  Menu,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react'

const primaryNav = [
  { label: 'Product', href: '#product' },
  { label: 'Features', href: '#features' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

const heroHighlights = [
  'Adaptive SM-2 scheduling keeps you focused on high-impact reviews',
  'AI-crafted sentences, images, and audio for every flashcard',
  'Purpose-built workflows that scale from solo learners to global teams',
]

const metrics = [
  { label: 'Avg. retention after 6 weeks', value: '95%' },
  { label: 'Monthly active learners', value: '12k+' },
  { label: 'Days to fluency milestones', value: '-47%' },
]

const logos = ['Polyglot Labs', 'Atlas Academy', 'Nova Language', 'LinguaPro', 'BrightPath Edu']

const differentiators = [
  {
    title: 'Purpose-built for mastery',
    description:
      'Every interaction is engineered to deliver measurable progress without addictive dark patterns.',
    icon: ShieldCheck,
  },
  {
    title: 'Insights you can act on',
    description: 'Review heatmaps, streak analytics, and predictive forecasting surface exactly what to tackle next.',
    icon: LineChart,
  },
  {
    title: 'Seamless collaboration',
    description: 'Invite peers, sync glossaries, and manage shared desks with enterprise-grade permissions.',
    icon: Users,
  },
]

const features = [
  {
    title: 'AI-Generated Flashcards',
    description:
      'Context-rich sentences, vivid imagery, and natural pronunciation crafted by our multi-model AI pipeline.',
    icon: Brain,
  },
  {
    title: 'Scientific Scheduling',
    description: 'SM-2 with adaptive ease calibration and relearning safeguards keeps long-term recall high.',
    icon: CalendarClock,
  },
  {
    title: 'Immersive Study Modes',
    description: 'Audio-first drills, focus timers, and guided review flows adapt to your goals in real time.',
    icon: Sparkles,
  },
  {
    title: 'Team Playbooks',
    description: 'Reusable study blueprints align instructors, cohorts, and teammates around shared objectives.',
    icon: Layers,
  },
  {
    title: 'Operational Insights',
    description: 'Track coverage, accuracy, and velocity with export-ready dashboards built for stakeholders.',
    icon: BarChart3,
  },
  {
    title: 'Enterprise-Grade Security',
    description: 'SOC2-ready architecture, SSO, and granular access controls keep sensitive data protected.',
    icon: ShieldCheck,
  },
]

const workflow = [
  {
    step: '01',
    title: 'Ingest',
    description:
      'Import words from spreadsheets, capture from camera, or type them manually. Fanki enriches each entry instantly.',
  },
  {
    step: '02',
    title: 'Train',
    description:
      'Adaptive review sessions blend active recall, listening, and context drills for durable mastery.',
  },
  {
    step: '03',
    title: 'Measure',
    description:
      'Analytics reveal accuracy trends, retention risk, and top wins to keep teams accountable.',
  },
]

const testimonials = [
  {
    quote:
      'Fanki helped our distributed team align on a single vocabulary in weeks, not months. The AI content feels tailor-made for our industry.',
    name: 'Marina Lopez',
    role: 'Head of Enablement · Atlas Academy',
  },
  {
    quote:
      'The predictive insights let me coach learners before they fall behind. It is the first platform that makes language ops measurable.',
    name: 'Samir Patel',
    role: 'Director of Language Ops · Nova Language',
  },
  {
    quote:
      'Our students love the modern UI and smart review flows. Engagement jumped 62% after the switch to Fanki.',
    name: 'Elena Chen',
    role: 'Program Lead · BrightPath Edu',
  },
]

const pricing = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for solo learners exploring smarter study habits.',
    highlights: ['500 flashcards', 'AI-generated sentences', 'Mobile access', 'Personal analytics'],
    cta: 'Start for Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$19',
    description: 'Advanced tools for power learners and emerging teams.',
    highlights: ['Unlimited desks', 'Audio + imagery generation', 'Progress forecasting', 'Priority support'],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: "Let's talk",
    description: 'Compliance, integrations, and concierge onboarding for global teams.',
    highlights: ['Custom SSO & SCIM', 'Admin analytics suite', 'Dedicated CSM', 'Usage-based pricing'],
    cta: 'Book a Demo',
    highlighted: false,
  },
]

const faqs = [
  {
    question: 'How does Fanki generate high-quality flashcards?',
    answer:
      'We orchestrate multiple AI models to craft example sentences, audio, and imagery, then validate them against linguistic heuristics so everything stays accurate and culturally nuanced.',
  },
  {
    question: 'Can I bring my existing word lists into Fanki?',
    answer:
      'Yes. Upload CSVs, capture photos of textbooks, or add terms manually. Our enrichment pipeline instantly adds context to every entry.',
  },
  {
    question: 'What makes your spaced repetition smarter?',
    answer:
      'We extend SM-2 with dynamic ease adjustments, relearning safeguards, and predictive alerts so you never miss critical reviews.',
  },
  {
    question: 'Do you support teams and classrooms?',
    answer:
      'Absolutely. Shared desks, role-based permissions, analytics exports, and LMS integrations keep everyone aligned.',
  },
]

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-[1.02]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 shadow-lg shadow-blue-500/40">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight sm:text-2xl">
              <span className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 bg-clip-text text-transparent">Fanki</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-200 lg:flex">
            {primaryNav.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden text-slate-200 hover:text-white lg:inline-flex" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button
              className="hidden bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow-lg shadow-blue-500/40 hover:from-blue-500 hover:via-indigo-400 hover:to-purple-400 lg:inline-flex"
              asChild
            >
              <Link href="/auth/register">Get Started</Link>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-slate-200 hover:text-white lg:hidden"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {mobileOpen ? (
          <div className="border-t border-slate-800/60 bg-slate-950/95 text-sm lg:hidden">
            <div className="container mx-auto space-y-4 px-4 py-4">
              <div className="flex flex-col gap-3">
                {primaryNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-slate-200 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="ghost" className="text-slate-200 hover:text-white" asChild>
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow-lg hover:from-blue-500 hover:via-indigo-400 hover:to-purple-400"
                  asChild
                >
                  <Link href="/auth/register" onClick={() => setMobileOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden pb-20 pt-24 sm:pt-28" id="hero">
          <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-blue-600/30 via-slate-950/40 to-slate-950/95 blur-3xl"></div>
          <div className="container relative z-10 mx-auto grid gap-16 px-4 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-blue-200">
                Backed by learning science
              </div>
              <div className="space-y-6">
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
                  Master new languages with AI that feels like a private tutor.
                </h1>
                <p className="max-w-xl text-base text-slate-300 sm:text-lg">
                  Fanki orchestrates adaptive spaced repetition, AI-generated context, and modern analytics so teams and
                  individuals build vocabulary effortlessly&mdash;without ever losing momentum.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="group bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-6 py-3 text-base font-semibold text-white shadow-xl shadow-blue-500/40 transition-all duration-300 hover:scale-[1.01] hover:from-blue-500 hover:via-indigo-400 hover:to-purple-400"
                  asChild
                >
                  <Link href="/auth/register">
                    Start Learning for Free
                    <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-700/70 bg-white/5 px-6 py-3 text-base font-semibold text-white backdrop-blur hover:bg-white/10"
                  asChild
                >
                  <Link href="#features">Experience the platform</Link>
                </Button>
              </div>
              <ul className="space-y-3 text-sm text-slate-300">
                {heroHighlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-300" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
              <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs uppercase tracking-[0.25em] text-blue-200/80">
                  Trusted by language leaders at
                  <div className="flex flex-wrap items-center gap-3 text-sm font-semibold tracking-tight text-white/90">
                    {logos.map((logo) => (
                      <span key={logo} className="rounded-full border border-white/10 px-3 py-1">
                        {logo}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center">
                      <p className="text-3xl font-semibold text-white">{metric.value}</p>
                      <p className="mt-1 text-xs text-slate-300">{metric.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 text-center sm:flex-row sm:text-left">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Star className="h-5 w-5 text-amber-300" />
                    4.9 / 5 satisfaction score
                  </div>
                  <p className="text-xs text-slate-400">Based on enterprise pilots across 38 organizations</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 rounded-[38px] bg-gradient-to-br from-blue-500/30 via-indigo-500/20 to-purple-500/20 blur-3xl"></div>
              <div className="relative rounded-[34px] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-blue-500/30 ring-1 ring-white/5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Morning Focus Session</p>
                    <p className="text-xs text-slate-400">12 cards • Spanish → English</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-200">
                    <Sparkles className="h-4 w-4" />
                    AI Assist
                  </div>
                </div>
                <div className="mt-6 space-y-6">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-blue-200">Flashcard preview</p>
                    <p className="mt-3 text-sm text-slate-200">&ldquo;La sinergia entre los equipos globales acelera la innovaci&oacute;n.&rdquo;</p>
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-300">
                      <span>
                        Keyword: <span className="font-semibold text-white">sinergia</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-blue-200">
                        <Clock className="h-3 w-3" /> Next review in 3 hrs
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Retention forecast</span>
                      <span className="inline-flex items-center gap-1 text-emerald-300">
                        <TrendingUp className="h-3 w-3" /> +12% week over week
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {[72, 84, 91, 97, 99].map((score) => (
                        <div key={score} className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
                          <p className="text-lg font-semibold text-white">{score}%</p>
                          <p className="text-[10px] text-emerald-200">Week {Math.ceil(score / 20)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-blue-200">Study streak</p>
                      <p className="text-2xl font-semibold text-white">21 days</p>
                    </div>
                    <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                      Continue session
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="product" className="relative overflow-hidden bg-slate-950 py-20">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"></div>
          <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">Built for outcomes, not vanity metrics.</h2>
              <p className="text-base text-slate-300">
                A platform that feels at home with modern design standards while delivering the operational rigor language
                leaders demand.
              </p>
              <div className="space-y-6">
                {differentiators.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="flex gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                      <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                        <p className="text-sm text-slate-300">{item.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="grid gap-6 rounded-[34px] border border-white/10 bg-slate-900/70 p-8 shadow-xl shadow-blue-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-blue-200">Program dashboard</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Command every learning initiative</h3>
                </div>
                <Star className="h-6 w-6 text-blue-200" />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {[
                  { label: 'Active cohorts', value: '48', delta: '+6 this month' },
                  { label: 'Completion rate', value: '92%', delta: '+8 pts QoQ' },
                  { label: 'At-risk learners', value: '4', delta: 'Flagged for coaching' },
                  { label: 'New content published', value: '128', delta: 'Across 9 desks' },
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-blue-200">{item.label}</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
                    <p className="mt-1 text-xs text-slate-300">{item.delta}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 text-xs text-slate-300">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-white">
                  <ShieldCheck className="h-4 w-4" /> GDPR + SOC2 controls
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-white">
                  <Zap className="h-4 w-4" /> Real-time AI enrichment
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-white">
                  <LineChart className="h-4 w-4" /> Executive-ready exports
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="relative overflow-hidden bg-slate-100 py-20 text-slate-900">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
          <div className="container mx-auto space-y-14 px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                Platform capabilities
              </p>
              <h2 className="mt-6 text-3xl font-semibold sm:text-4xl">A modern stack for serious language teams.</h2>
              <p className="mt-4 text-base text-slate-600">
                From AI enrichment to enterprise governance, Fanki gives you the end-to-end platform you need to accelerate
                fluency without custom tooling.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-indigo-400/5 to-purple-400/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                    <div className="relative z-10 space-y-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-white shadow-lg shadow-blue-500/30">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                      <p className="text-sm leading-relaxed text-slate-600">{feature.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section id="workflow" className="relative overflow-hidden bg-white py-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div className="space-y-5">
                <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                  Intelligent automation
                </p>
                <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Everything works together&mdash;automatically.</h2>
                <p className="text-base text-slate-600">
                  Fanki combines data-driven workflows with delightful UI so your learners stay immersed while the platform
                  handles the busy work behind the scenes.
                </p>
                <div className="grid gap-6">
                  {workflow.map((step) => (
                    <div key={step.title} className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                        {step.step}
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                        <p className="text-sm leading-relaxed text-slate-600">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/20 blur-3xl"></div>
                <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-400/30 to-blue-400/20 blur-3xl"></div>
                <div className="relative rounded-[32px] border border-slate-200 bg-slate-50 p-8 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Live forecast</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">Retention confidence</h3>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <TrendingUp className="h-3 w-3" /> +18% YoY
                    </div>
                  </div>
                  <div className="mt-6 space-y-5">
                    <div>
                      <div className="flex items-baseline justify-between text-sm text-slate-600">
                        <span>Vocabulary mastery</span>
                        <span className="font-semibold text-slate-900">76%</span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                      </div>
                    </div>
                    <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-5">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Upcoming sessions</span>
                        <span>Automated reminders enabled</span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {['Listening lab', 'Context drill', 'Confidence boost'].map((session) => (
                          <div key={session} className="rounded-2xl border border-slate-200 bg-slate-100 p-4 text-xs">
                            <p className="font-semibold text-slate-900">{session}</p>
                            <p className="mt-1 text-slate-500">Scheduled</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white/70 p-5">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Automation summary</p>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <p className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Synced with Canvas & Moodle
                        </p>
                        <p className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Reminders triggered for 6 at-risk learners
                        </p>
                        <p className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> New desk translated into 4 languages
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="relative overflow-hidden bg-slate-950 py-20">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"></div>
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-blue-200">
                Customer stories
              </p>
              <h2 className="mt-6 text-3xl font-semibold text-white sm:text-4xl">Teams trust Fanki to deliver real adoption.</h2>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div key={testimonial.name} className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                  <Quote className="absolute -top-6 -left-4 h-16 w-16 text-blue-400/40" />
                  <p className="relative text-sm leading-relaxed text-slate-200">{testimonial.quote}</p>
                  <div className="relative mt-8 pt-6">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    <p className="mt-4 text-sm font-semibold text-white">{testimonial.name}</p>
                    <p className="text-xs text-slate-400">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="relative overflow-hidden bg-white py-20">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                Pricing built for growth
              </p>
              <h2 className="mt-6 text-3xl font-semibold text-slate-900 sm:text-4xl">Start free, scale without friction.</h2>
              <p className="mt-4 text-base text-slate-600">
                Transparent plans that support your language operations from the first flashcard to global rollouts.
              </p>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {pricing.map((tier) => (
                <div
                  key={tier.name}
                  className={`relative rounded-3xl border bg-white p-8 shadow-lg transition-all duration-300 ${
                    tier.highlighted ? 'border-slate-900 shadow-2xl ring-4 ring-blue-500/10' : 'border-slate-200'
                  }`}
                >
                  {tier.highlighted ? (
                    <span className="absolute -top-3 right-6 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white">
                      Most Popular
                    </span>
                  ) : null}
                  <h3 className="text-lg font-semibold text-slate-900">{tier.name}</h3>
                  <p className="mt-3 text-4xl font-bold text-slate-900">{tier.price}</p>
                  <p className="mt-2 text-sm text-slate-500">{tier.description}</p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-600">
                    {tier.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`mt-8 w-full ${
                      tier.highlighted
                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                    asChild
                  >
                    <Link href="/auth/register">{tier.cta}</Link>
                  </Button>
                </div>
              ))}
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
              <h2 className="mt-6 text-3xl font-semibold sm:text-4xl">Answers for leaders and learners alike.</h2>
              <p className="mt-4 text-base text-slate-600">
                Need deeper information? Our team is ready with implementation guides, security documentation, and ROI playbooks.
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

        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-20">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          <div className="container relative z-10 mx-auto px-4 text-center">
            <div className="mx-auto max-w-3xl space-y-6">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                Ready to bring intelligent language training to your organization?
              </h2>
              <p className="text-base text-blue-100">
                Create a free workspace in minutes or connect with our team for a guided strategy session tailored to your goals.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-white/90 px-6 py-3 text-base font-semibold text-slate-900 shadow-lg hover:bg-white"
                  asChild
                >
                  <Link href="/auth/register">Launch your workspace</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/50 px-6 py-3 text-base font-semibold text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="mailto:hello@fanki.ai">Talk to sales</Link>
                </Button>
              </div>
              <p className="text-xs uppercase tracking-[0.35em] text-blue-200/80">
                Join product teams, universities, and global enterprises leveling up with Fanki.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/60 bg-slate-950 py-12">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-white">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-xl font-semibold text-white">Fanki</span>
            </Link>
            <p className="text-sm text-slate-400">
              AI-powered language proficiency with enterprise-ready delivery. Built in San Francisco, trusted worldwide.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span>© {new Date().getFullYear()} Fanki Labs, Inc.</span>
              <span>Privacy</span>
              <span>Security</span>
              <span>Terms</span>
            </div>
          </div>
          <div className="grid gap-6 text-sm text-slate-300 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Product</p>
              <Link href="#product" className="block text-slate-300 transition-colors hover:text-white">
                Why Fanki
              </Link>
              <Link href="#features" className="block text-slate-300 transition-colors hover:text-white">
                Features
              </Link>
              <Link href="#pricing" className="block text-slate-300 transition-colors hover:text-white">
                Pricing
              </Link>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Company</p>
              <Link href="mailto:hello@fanki.ai" className="block text-slate-300 transition-colors hover:text-white">
                Contact
              </Link>
              <Link href="/auth/register" className="block text-slate-300 transition-colors hover:text-white">
                Create workspace
              </Link>
              <Link href="/auth/login" className="block text-slate-300 transition-colors hover:text-white">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}