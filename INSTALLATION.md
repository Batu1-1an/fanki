# 🚀 Fanki Installation Guide

This guide will help you set up Fanki on your local machine for development or production deployment.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager (comes with Node.js)
- **Git** for version control
- **Supabase** account ([Sign up free](https://supabase.com))

### Verify Prerequisites

```bash
node --version  # Should be 18.x or higher
npm --version   # Should be 9.x or higher
git --version   # Any recent version
```

---

## 📥 Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/fanki.git

# Navigate to project directory
cd fanki
```

---

## 📦 Step 2: Install Dependencies

```bash
# Install all dependencies
npm install

# This will install:
# - Next.js 15.5.3
# - React 19.1.1
# - Supabase client
# - Testing dependencies (Vitest)
# - UI components (Shadcn/ui)
# - And all other dependencies
```

**Expected install time**: 1-3 minutes depending on your internet connection.

**Note**: You may see peer dependency warnings - these are safe to ignore with Next.js 15 and React 19.

---

## 🔐 Step 3: Set Up Environment Variables

### Create Environment File

```bash
# Copy the example environment file
cp .env.example .env.local
```

### Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Create a new project (or use existing)
3. Go to **Settings → API**
4. Copy the following:
   - Project URL
   - Anon/Public Key

### Configure .env.local

Open `.env.local` and fill in your credentials:

```env
# Required: Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Required: Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Important**: Never commit `.env.local` to version control!

---

## 🗄️ Step 4: Set Up Database

### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push
```

### Option B: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy content from `supabase/migrations/` files (in order by timestamp)
4. Execute each migration file

**Note**: Migrations must be applied in chronological order (oldest first).

---

## ⚡ Step 5: Deploy Edge Functions

Fanki uses Supabase Edge Functions for AI features.

### Set API Keys

```bash
# Set required secrets
supabase secrets set GEMINI_API_KEY=your-gemini-api-key
supabase secrets set ELEVENLABS_API_KEY=your-elevenlabs-key
supabase secrets set UNSPLASH_ACCESS_KEY=your-unsplash-key
```

**Getting API Keys:**
- **Gemini**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- **ElevenLabs**: [ElevenLabs Dashboard](https://elevenlabs.io/)
- **Unsplash**: [Unsplash Developers](https://unsplash.com/developers)

### Deploy Functions

```bash
# Deploy all edge functions
supabase functions deploy

# Or deploy individually
supabase functions deploy generate-sentences
supabase functions deploy generate-image
supabase functions deploy generate-audio
supabase functions deploy generate-memory-hook
supabase functions deploy generate-flashcards-from-image
```

---

## 🧪 Step 6: Run Tests (Optional but Recommended)

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui
```

**Expected result**: All tests should pass ✅

---

## 🏃 Step 7: Start Development Server

```bash
# Start the development server
npm run dev
```

The application will start on [http://localhost:3000](http://localhost:3000)

**You should see:**
```
▲ Next.js 15.5.3
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.3s
```

---

## ✅ Step 8: Verify Installation

### Test the Application

1. **Open browser**: Navigate to `http://localhost:3000`
2. **Create account**: Click "Sign Up" and register
3. **Verify email**: Check your email for verification link
4. **Add a card**: Try creating your first flashcard
5. **Start session**: Test the study session functionality

### Check Database Connection

Go to Supabase dashboard → **Database → Tables**

You should see these tables:
- profiles
- words
- cards
- notes
- reviews
- study_sessions
- desks
- note_types
- card_templates

### Check Edge Functions

```bash
# List deployed functions
supabase functions list

# Should show:
# - generate-sentences (ACTIVE)
# - generate-image (ACTIVE)
# - generate-audio (ACTIVE)
# - generate-memory-hook (ACTIVE)
# - generate-flashcards-from-image (ACTIVE)
```

---

## 🐛 Troubleshooting

### Common Issues

#### Issue: "Module not found" errors

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Issue: Supabase connection fails

**Solution:**
1. Verify `.env.local` has correct credentials
2. Check project is not paused in Supabase dashboard
3. Verify API keys are correct
4. Try restarting dev server

#### Issue: Edge functions not working

**Solution:**
```bash
# Verify secrets are set
supabase secrets list

# Redeploy functions
supabase functions deploy --no-verify-jwt
```

#### Issue: Tests fail

**Solution:**
```bash
# Install testing dependencies explicitly
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom

# Run tests again
npm test
```

#### Issue: TypeScript errors

**Solution:**
```bash
# Run type check to see errors
npm run type-check

# Often fixed by restarting TypeScript server in your IDE
# VS Code: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

#### Issue: Port 3000 already in use

**Solution:**
```bash
# Kill process on port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
npm run dev -- -p 3001
```

---

## 🎉 Next Steps

After successful installation:

1. **Read the User Guide**: `docs/USER_GUIDE.md`
2. **Explore the API**: `docs/API.md`
3. **Check Contributing Guidelines**: `CONTRIBUTING.md`
4. **Join the Community**: [Discord/GitHub Discussions]

### Development Workflow

```bash
# Daily workflow
npm run dev          # Start dev server
npm test -- --watch  # Run tests in watch mode
npm run lint         # Check code style
npm run type-check   # Verify types
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev/)
- [Vitest Documentation](https://vitest.dev/)

---

## 🆘 Getting Help

If you encounter issues:

1. **Check troubleshooting section** above
2. **Search existing issues** on GitHub
3. **Check documentation** in `docs/` folder
4. **Ask in discussions** on GitHub
5. **Create an issue** with detailed info

### When Creating an Issue

Include:
- Node.js version (`node --version`)
- npm version (`npm --version`)
- Operating system
- Error messages (full stack trace)
- Steps to reproduce

---

## ✨ Success!

You should now have Fanki running locally! 🎉

**Verify everything works:**
- [ ] Application loads at http://localhost:3000
- [ ] Can create an account
- [ ] Can add a word/card
- [ ] Can start a study session
- [ ] Tests pass
- [ ] No console errors

**Happy learning! 📚🧠**

---

*Last Updated: 2025-01-17*  
*Version: 1.0.0*
