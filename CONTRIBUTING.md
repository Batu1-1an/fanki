# Contributing to Fanki

Thank you for your interest in contributing to Fanki! This document provides guidelines and instructions for contributing.

## 🎯 Ways to Contribute

- 🐛 Report bugs and issues
- ✨ Suggest new features
- 📝 Improve documentation
- 🧪 Write tests
- 💻 Submit code changes
- 🌍 Help with translations

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Git installed
- Supabase account (for database features)
- Basic knowledge of React, Next.js, and TypeScript

### Setup Development Environment

1. **Fork the repository**

   Click the "Fork" button at the top right of the repository page.

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/fanki.git
   cd fanki
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/original/fanki.git
   ```

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your Supabase credentials in `.env.local`.

6. **Run the development server**

   ```bash
   npm run dev
   ```

7. **Run tests**

   ```bash
   npm test
   ```

## 📋 Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `test/` - Adding or updating tests
- `refactor/` - Code refactoring

### 2. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add comments for complex logic
- Update documentation as needed
- Write tests for new features

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage

# Type check
npm run type-check

# Lint
npm run lint
```

### 4. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: add typing card component"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding/updating tests
- `refactor:` - Code refactoring
- `style:` - Code style changes
- `perf:` - Performance improvements
- `chore:` - Maintenance tasks

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## 🧪 Testing Guidelines

### Writing Tests

- Place test files next to the code they test
- Name test files with `.test.ts` or `.test.tsx` extension
- Write descriptive test names
- Test edge cases and error conditions
- Aim for >80% code coverage

### Test Structure

```typescript
import { describe, it, expect } from 'vitest'

describe('Component/Function Name', () => {
  describe('specific behavior', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test'
      
      // Act
      const result = functionUnderTest(input)
      
      // Assert
      expect(result).toBe('expected')
    })
  })
})
```

## 📝 Code Style Guide

### TypeScript

- Use TypeScript strict mode
- Define explicit types for function parameters and return values
- Use interfaces for object shapes
- Avoid `any` type when possible

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use TypeScript for prop types

### Naming Conventions

- **Files**: camelCase for utils, PascalCase for components
- **Components**: PascalCase
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase

### Code Organization

```
src/
├── app/              # Next.js pages
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   ├── cards/       # Card-specific components
│   └── words/       # Word management components
├── lib/             # Business logic
├── types/           # TypeScript definitions
├── utils/           # Utility functions
└── test/            # Test utilities
```

## 🐛 Reporting Bugs

### Before Submitting

1. Check existing issues to avoid duplicates
2. Try to reproduce the bug
3. Collect relevant information

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., Windows, macOS, Linux]
- Browser: [e.g., Chrome, Firefox, Safari]
- Version: [e.g., 1.0.0]

**Additional context**
Any other relevant information.
```

## ✨ Suggesting Features

### Feature Request Template

```markdown
**Feature Description**
Clear description of the feature.

**Problem it Solves**
What problem does this feature address?

**Proposed Solution**
How would you implement this?

**Alternatives Considered**
Other approaches you've thought about.

**Additional Context**
Mockups, examples, or references.
```

## 📖 Documentation

### Documentation Standards

- Use clear, concise language
- Include code examples
- Add screenshots where helpful
- Keep documentation up-to-date with code changes

### Where to Document

- **README.md** - Project overview and quick start
- **Code comments** - Complex logic explanations
- **docs/** - Detailed guides and technical docs
- **JSDoc** - Function and API documentation

## 🔍 Code Review Process

### What We Look For

- ✅ Code quality and readability
- ✅ Test coverage
- ✅ Documentation updates
- ✅ Performance considerations
- ✅ Security implications
- ✅ Breaking changes noted

### Pull Request Checklist

Before submitting your PR, ensure:

- [ ] Code follows project style guidelines
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] Commits follow conventional commit format
- [ ] No console.log statements left in code
- [ ] No merge conflicts
- [ ] PR description clearly explains changes

## 🎨 UI/UX Guidelines

- Follow existing design patterns
- Ensure responsive design (mobile + desktop)
- Test accessibility (keyboard navigation, screen readers)
- Use Tailwind CSS for styling
- Use Shadcn/ui components when available

## 🔒 Security

### Reporting Security Issues

**Do NOT** create public issues for security vulnerabilities.

Instead:
1. Email security concerns privately
2. Include detailed description
3. Wait for acknowledgment before disclosure

### Security Best Practices

- Never commit API keys or secrets
- Use environment variables for sensitive data
- Validate all user inputs
- Follow OWASP guidelines
- Keep dependencies updated

## 📜 License

By contributing to Fanki, you agree that your contributions will be licensed under the MIT License.

## 💬 Communication

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and ideas
- **Pull Requests** - Code contributions

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project credits

Thank you for contributing to Fanki! 🎉
