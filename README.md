<div align="center">
  <h1>📚 Fanki</h1>
  <p><strong>Smart flashcards powered by spaced repetition & AI</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-15.5.3-000000?logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react&logoColor=white" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.6.2-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white" alt="Vitest" />
    <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" />
  </p>
</div>

---

## ✨ Features

| Icon | Feature | Description |
|------|---------|-------------|
| 🧠 | **SM-2 Spaced Repetition** | Optimal scheduling algorithm proven by decades of learning science |
| 🎴 | **Multiple Card Types** | Basic, Cloze, Typing, Reverse, and Image Occlusion |
| 🤖 | **AI-Powered Content** | Auto-generate sentences, images, mnemonics, and audio via Gemini & ElevenLabs |
| 📊 | **Progress Tracking** | Detailed analytics, study streaks, and learning path visualization |
| 📂 | **Desk Organization** | Group cards into desks for focused study sessions |
| ⚡ | **Chunked Prefetching** | Instant card transitions with intelligent background loading |
| 🎨 | **Modern UI** | Polished, responsive design with smooth framer-motion animations |
| 🔒 | **RLS Security** | Row-level security via Supabase for data isolation |
| 🔑 | **OAuth + Email Auth** | Google sign-in or email/password authentication |
| 🌄 | **Unsplash Integration** | Contextual imagery to reinforce vocabulary retention |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────────┐  │
│  │  Auth UI  │  │  Dashboard   │  │     Study Session         │  │
│  │  (Login/  │  │  (Stats,     │  │  ┌─────────────────────┐  │  │
│  │   Signup) │  │   Streaks)   │  │  │ Card Renderer       │  │  │
│  └────┬─────┘  └──────┬───────┘  │  │ ┌───┐ ┌───┐ ┌───┐   │  │  │
│       │               │          │  │ │ B │ │ C │ │ T │   │  │  │
│       ▼               ▼          │  │ │ a │ │ l │ │ y │   │  │  │
│  ┌───────────────────────────────────────┤ │ s │ │ o │ │ p │   │  │  │
│  │        Next.js App Router             │ │ i │ │ z │ │ e │   │  │  │
│  │  (RSC + API Routes + Middleware)      │ │ c │ │ e │ │   │   │  │  │
│  └──────────────┬──────────────────────┘  │ └───┘ └───┘ └───┘   │  │  │
│                 │                          └─────────────────────┘  │  │
│                 ▼                          ┌──────────────────┐    │  │
│    ┌──────────────────────┐               │  Review Queue     │    │  │
│    │   Supabase Client    │◄──────────────┤  Manager (SM-2)   │    │  │
│    │   @supabase/ssr      │               └──────────────────┘    │  │
│    └──────────┬───────────┘                                        │  │
└───────────────┼────────────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Supabase Backend                            │
│  ┌──────────────┐  ┌─────────────────┐  ┌────────────────────┐  │
│  │  PostgreSQL   │  │  Edge Functions │  │    Storage         │  │
│  │  (SM-2 data,  │  │  (Gemini,       │  │  (Flashcard images │  │
│  │   reviews,    │  │   ElevenLabs,   │  │   & audio)         │  │
│  │   users)      │  │   Unsplash)    │  │                    │  │
│  └──────────────┘  └─────────────────┘  └────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

        ┌──────────────┐     ┌────────────────┐     ┌───────────────┐
        │  Google      │     │  ElevenLabs     │     │  Unsplash     │
        │  Gemini AI   │─────│  Text-to-Speech │─────│  Image Search │
        └──────────────┘     └────────────────┘     └───────────────┘
```

### Study Flow

```
Login → Dashboard (due counts, streak) → Start Session
  → Queue Manager (overdue > due > new > future)
  → Prefetch Chunk → Render Card → Review (Again/Hard/Good/Easy)
  → SM-2 Recalculate → Save Review → Next Card
  → Session Complete → Dashboard Refresh
```

---

## 🚀 Quick Start

```bash
# Clone & install
git clone https://github.com/yourusername/fanki.git
cd fanki
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Set up Supabase
npx supabase link --project-ref your-project-ref
npx supabase db push

# Deploy Edge Functions (for AI features)
npx supabase secrets set GEMINI_API_KEY=your_gemini_key
npx supabase secrets set ELEVENLABS_API_KEY=your_elevenlabs_key
npx supabase secrets set UNSPLASH_ACCESS_KEY=your_unsplash_key
npx supabase functions deploy

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🧪 Testing

```bash
npm test           # Run all tests
npm run test:ui    # Vitest UI mode
npm run test:coverage  # With coverage report
```

---

## 📁 Project Structure

```
fanki/
├── src/
│   ├── app/                    # Next.js App Router pages & API routes
│   │   ├── api/                # Route handlers (flashcards, reviews, etc.)
│   │   ├── auth/               # Login, register, callback
│   │   ├── dashboard/          # Main dashboard & progress
│   │   ├── study/              # Study session page
│   │   ├── flashcards/         # Demo & flashcard views
│   │   ├── profile/            # User profile
│   │   └── settings/           # App settings
│   ├── components/
│   │   ├── cards/              # Card renderers (Cloze, Typing)
│   │   ├── dashboard/          # Dashboard widgets
│   │   ├── flashcards/         # Study session components
│   │   ├── layout/             # Sidebar, nav layout
│   │   ├── onboarding/         # Tutorial & first-run
│   │   ├── ui/                 # shadcn/ui primitives
│   │   └── words/              # Word management UI
│   ├── lib/                    # Business logic & API clients
│   │   └── supabase/           # Client & server wrappers
│   ├── hooks/                  # React hooks (useAuth, useOnboarding)
│   ├── types/                  # TypeScript definitions
│   ├── utils/                  # SM-2 algorithm, helpers
│   └── test/                   # Test setup
├── supabase/
│   └── functions/              # Edge Functions (AI, images, audio)
├── docs/                       # Documentation
├── public/                     # Static assets
├── .github/                    # CI/CD workflows
└── plan/                       # Planning docs (internal)
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **UI Library** | React 19, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Backend** | Supabase (PostgreSQL, Edge Functions) |
| **Auth** | Supabase Auth (email + Google OAuth) |
| **AI** | Google Gemini, ElevenLabs TTS, Unsplash API |
| **Testing** | Vitest, Testing Library, jsdom |
| **Animations** | Framer Motion |
| **Algorithm** | SM-2 Spaced Repetition |

---

## 📄 License

MIT — see [LICENSE](LICENSE).

---

<p align="center"><strong>Built with ❤️ for lifelong learners</strong></p>
