# Contributing to Fanki

Thank you for your interest in contributing to Fanki!

## Quick Start

```bash
# Fork & clone
git clone https://github.com/YOUR_USERNAME/fanki.git
cd fanki
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start dev server
npm run dev
```

### Docker Development

```bash
# Build and run with Docker
docker build -t fanki .
docker run -p 3000:3000 --env-file .env.local fanki
```

## Development Commands

```bash
npm test           # Run all tests
npm run test:ui    # Vitest UI mode
npm run type-check # TypeScript type check
npm run lint       # ESLint
npm run build      # Production build
```

## Guidelines

- Follow existing code style and conventions
- Write tests for new features (Vitest + Testing Library)
- Use conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`
- Place test files next to the code they test (`.test.ts` / `.test.tsx`)
- Keep components small and focused; extract reusable logic into hooks
- Never commit API keys or secrets; use environment variables

## Pull Request Process

1. Create a branch: `feature/your-feature` or `fix/your-bug`
2. Make changes with clear commit messages
3. Ensure all tests pass: `npm test`
4. Ensure type-check and lint pass: `npm run type-check && npm run lint`
5. Push and open a Pull Request against `main`

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
