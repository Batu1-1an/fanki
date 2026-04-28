# Changelog

All notable changes to Fanki are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Dockerfile with multi-stage build (deps → builder → runner) for optimized production images
- .dockerignore excluding dev and build artifacts from Docker context
- CHANGELOG.md for project history tracking

### Changed

- next.config.mjs: enable `output: standalone` for Docker compatibility, add `poweredByHeader: false` and `reactStrictMode: true`, add unsplash.com to image remotePatterns, remove deprecated domains config

### Fixed

- `card-queue-manager.test.ts`: fix due-date filter test with future-proof date
- `flashcards/route.test.ts`: fix due-date filter test with future-proof date
- `words/route.test.ts`: fix boolean coercion in validation tests (`&&` → `!!()`), fix empty-string validation logic

## [0.1.0] - 2025-01-17

### Added

- Next.js 15 App Router with TypeScript
- SM-2 spaced repetition algorithm implementation
- Supabase integration (auth, database, storage, edge functions)
- AI-powered card generation with Google Gemini
- Multiple card types: Basic, Cloze, Typing, Reverse, Image Occlusion
- Dashboard with progress tracking, study streaks, and analytics
- Desk organization system for grouping flashcards
- Chunked prefetching for smooth card transitions
- Modern UI with Tailwind CSS, shadcn/ui, and Framer Motion animations
- Authentication via Supabase Auth (email/password + Google OAuth)
- Row-level security (RLS) for data isolation
- ElevenLabs text-to-speech integration
- Unsplash image search integration
- Comprehensive test suite with Vitest and Testing Library
- CI/CD pipeline with GitHub Actions
- Security documentation and vulnerability disclosure policy
- MIT License
