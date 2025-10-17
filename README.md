# 📚 Fanki - Modern Flashcard Learning App

A powerful spaced repetition flashcard application built with Next.js, React, and Supabase. Fanki helps you learn and retain information efficiently using the SM-2 algorithm.

![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black) ![React](https://img.shields.io/badge/React-19.1.1-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue) ![Supabase](https://img.shields.io/badge/Supabase-Latest-green)

## ✨ Features

- 🧠 **Spaced Repetition**: SM-2 algorithm for optimal learning
- 🎴 **Multiple Card Types**: Basic, Cloze, Reverse, Typing, and Image Occlusion
- 🤖 **AI-Powered Content**: Generate sentences, images, and pronunciation audio
- 📊 **Progress Tracking**: Detailed statistics and learning insights
- 📚 **Deck Organization**: Organize cards into custom desks (decks)
- ⚡ **Performance Optimized**: Chunked pre-fetching for instant card transitions
- 🎨 **Modern UI**: Beautiful, responsive design with smooth animations
- 🔒 **Secure**: Row-level security with Supabase

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account ([sign up free](https://supabase.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fanki.git
   cd fanki
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Set up Supabase**
   
   The database migrations are in `supabase/migrations/`. You can apply them using the Supabase CLI:
   ```bash
   npx supabase link --project-ref your-project-ref
   npx supabase db push
   ```
   
   Or manually apply the migrations in your Supabase dashboard.

5. **Set up Edge Functions**
   
   Deploy the edge functions for AI features:
   ```bash
   # Set your API keys as secrets
   npx supabase secrets set GEMINI_API_KEY=your_gemini_key
   npx supabase secrets set ELEVENLABS_API_KEY=your_elevenlabs_key
   npx supabase secrets set UNSPLASH_ACCESS_KEY=your_unsplash_key
   
   # Deploy functions
   npx supabase functions deploy
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing

Run tests with Vitest:

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## 📖 Usage

### Creating Your First Card

1. Sign up or log in to your account
2. Click "Add Word" in the dashboard
3. Enter the word, definition, and any additional information
4. Choose a card type (Basic, Cloze, etc.)
5. Click "Save"

### Studying Cards

1. Go to the Dashboard
2. Click "Start Study Session"
3. Review cards using the 4-button system:
   - **Again** (0): Completely forgot
   - **Hard** (3): Difficult to recall
   - **Good** (4): Recalled with minor difficulty
   - **Easy** (5): Perfect recall

### Organizing with Desks

1. Create a new desk from the Desk Manager
2. Assign words to desks
3. Filter your study sessions by desk

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI Services**: Google Gemini, ElevenLabs, Unsplash
- **Testing**: Vitest, Testing Library

### Project Structure

```
fanki/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   ├── cards/        # Card renderer components
│   │   ├── dashboard/    # Dashboard components
│   │   ├── flashcards/   # Study session components
│   │   ├── ui/           # Shadcn UI components
│   │   └── words/        # Word management components
│   ├── lib/              # Business logic & API functions
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions (SM-2, etc.)
│   └── test/             # Test setup and utilities
├── supabase/
│   ├── functions/        # Edge functions
│   └── migrations/       # Database migrations
├── docs/                 # Documentation
└── public/              # Static assets
```

### Database Schema

The application uses a flexible card-based system:

- **note_types**: Card type definitions (basic, cloze, etc.)
- **card_templates**: Templates for rendering cards
- **notes**: User-created content (words, phrases, etc.)
- **cards**: Individual reviewable items with SM-2 scheduling
- **reviews**: Review history and performance tracking
- **desks**: Organization/deck system
- **words**: Legacy word system (migrated to cards)

## 🔧 Configuration

### SM-2 Algorithm Parameters

The spaced repetition algorithm can be configured in `src/types/index.ts`:

```typescript
export const LEARNING_STEPS = [1, 10] // Minutes: 1 min, 10 min
export const GRADUATION_INTERVAL = 1 // Days after graduation
```

### Performance Settings

Chunked pre-fetching settings in `src/lib/queue-manager.ts`:

```typescript
const INITIAL_CHUNK_SIZE = 2 // Cards to fetch immediately
const CHUNK_SIZE = 10        // Background chunk size
const PREFETCH_THRESHOLD = 3 // When to fetch next chunk
```

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform supporting Next.js:

- Netlify
- AWS Amplify
- Railway
- Render

Make sure to set all environment variables in your deployment platform.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow the existing code style
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [SuperMemo SM-2 Algorithm](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [Anki](https://apps.ankiweb.net/) for inspiration
- [Shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Supabase](https://supabase.com/) for backend infrastructure

## 📧 Support

For questions or issues:

- Open an issue on GitHub
- Check the [documentation](./docs)
- Join our Discord community

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Collaborative decks
- [ ] Public deck marketplace
- [ ] Advanced analytics dashboard
- [ ] Voice recognition for pronunciation
- [ ] Offline mode with service workers
- [ ] Custom card templates
- [ ] Import/export from Anki

---

**Built with ❤️ by the Fanki team**
