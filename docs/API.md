# Fanki API Documentation

This document describes the core API functions and Edge Functions used in Fanki.

## 📋 Table of Contents

- [Client-Side API](#client-side-api)
  - [Words API](#words-api)
  - [Cards API](#cards-api)
  - [Reviews API](#reviews-api)
  - [Study Sessions API](#study-sessions-api)
  - [Desks API](#desks-api)
- [Edge Functions](#edge-functions)
  - [Generate Sentences](#generate-sentences)
  - [Generate Image](#generate-image)
  - [Generate Audio](#generate-audio)
  - [Generate Memory Hook](#generate-memory-hook)
  - [Generate Flashcards from Image](#generate-flashcards-from-image)

---

## Client-Side API

### Words API

Located in `src/lib/words.ts`

#### `getUserWords()`

Get all words for the current user.

```typescript
async function getUserWords(): Promise<{
  data: Word[] | null
  error: any
}>
```

**Returns:**
- `data`: Array of Word objects
- `error`: Error if operation failed

**Example:**
```typescript
const { data: words, error } = await getUserWords()
if (error) {
  console.error('Failed to fetch words:', error)
}
```

#### `createWord()`

Create a new word.

```typescript
async function createWord(word: Omit<Word, 'id' | 'created_at' | 'updated_at'>): Promise<{
  data: Word | null
  error: any
}>
```

**Parameters:**
- `word`: Word object without id and timestamps

**Example:**
```typescript
const { data: newWord, error } = await createWord({
  word: 'eloquent',
  definition: 'Fluent or persuasive in speaking or writing',
  language: 'en',
  difficulty: 3,
  pronunciation: '/ˈeləkwənt/',
  status: 'new'
})
```

---

### Cards API

Located in `src/lib/cards.ts`

#### `createNoteWithCards()`

Create a note and generate its cards.

```typescript
async function createNoteWithCards(params: CreateNoteParams): Promise<{
  noteId: string | null
  cardIds: string[]
  error: any
}>
```

**Parameters:**
```typescript
interface CreateNoteParams {
  userId: string
  noteTypeSlug: 'basic' | 'basic_reverse' | 'typing' | 'cloze' | 'image_occlusion'
  fields: Record<string, any>
  wordId?: string
  tags?: string[]
}
```

**Example:**
```typescript
// Basic card
const { noteId, cardIds, error } = await createNoteWithCards({
  userId: 'user-id',
  noteTypeSlug: 'basic',
  fields: {
    front: 'What is the capital of France?',
    back: 'Paris',
    extra: 'Located on the Seine River'
  }
})

// Cloze card
const { noteId, cardIds, error } = await createNoteWithCards({
  userId: 'user-id',
  noteTypeSlug: 'cloze',
  fields: {
    text: 'The {{c1::capital}} of France is {{c2::Paris}}',
    extra: 'Geography'
  }
})
```

#### `getNoteTypes()`

Get all available note types.

```typescript
async function getNoteTypes(): Promise<{
  data: NoteType[] | null
  error: any
}>
```

---

### Reviews API

Located in `src/lib/reviews.ts`

#### `submitReview()`

Submit a review for a card.

```typescript
async function submitReview(params: {
  wordId: string
  flashcardId?: string | null
  cardId?: string
  button: 'again' | 'hard' | 'good' | 'easy'
  responseTimeMs?: number
}): Promise<{
  data: Review | null
  error: any
}>
```

**Button Mapping:**
- `again` (0): Complete blackout
- `hard` (3): Correct with difficulty
- `good` (4): Correct with minor difficulty
- `easy` (5): Perfect recall

**Example:**
```typescript
const { data: review, error } = await submitReview({
  wordId: 'word-uuid',
  cardId: 'card-uuid',
  button: 'good',
  responseTimeMs: 3500
})
```

#### `getDueCards()`

Get cards due for review.

```typescript
async function getDueCards(
  limit?: number,
  sort?: 'recommended' | 'oldest' | 'easiest' | 'hardest',
  deskId?: string
): Promise<{
  data: ReviewCard[] | null
  error: any
}>
```

**Sort Options:**
- `recommended`: Shuffled variety (default)
- `oldest`: By due date
- `easiest`: By ease factor (desc)
- `hardest`: By ease factor (asc)

**Example:**
```typescript
const { data: cards, error } = await getDueCards(20, 'recommended', 'desk-uuid')
```

#### `getReviewStats()`

Get review statistics for the user.

```typescript
async function getReviewStats(): Promise<{
  totalReviews: number
  todaysReviews: number
  wordsDueToday: number
  retentionRate: number
  averageEaseFactor: number
  currentStreak: number
  error?: any
}>
```

---

### Study Sessions API

Located in `src/lib/study-sessions.ts`

#### `createStudySession()`

Create a new study session.

```typescript
async function createStudySession(sessionType: SessionType): Promise<{
  data: StudySession | null
  error: any
}>
```

#### `completeStudySession()`

Mark a study session as completed.

```typescript
async function completeStudySession(
  sessionId: string,
  stats: {
    cardsStudied: number
    cardsCorrect: number
    sessionDuration: number
  }
): Promise<{
  error: any
}>
```

---

### Desks API

Located in `src/lib/desks.ts`

#### `getUserDesks()`

Get all desks for the current user.

```typescript
async function getUserDesks(): Promise<{
  data: Desk[] | null
  error: any
}>
```

#### `createDesk()`

Create a new desk.

```typescript
async function createDesk(desk: {
  name: string
  description?: string
  color?: string
  icon?: string
}): Promise<{
  data: Desk | null
  error: any
}>
```

---

## Edge Functions

All edge functions are deployed to Supabase and require authentication.

### Base URL

```
https://your-project.supabase.co/functions/v1/
```

### Authentication

All requests must include:
```
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

---

### Generate Sentences

Generate cloze test sentences for a word using AI.

**Endpoint:** `/generate-sentences`

**Method:** POST

**Request Body:**
```json
{
  "word": "eloquent",
  "difficulty": "intermediate",
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "sentences": [
    {
      "sentence": "The lawyer gave an ___ speech.",
      "blank_position": 19,
      "correct_word": "eloquent"
    },
    {
      "sentence": "Her ___ writing captivated readers.",
      "blank_position": 4,
      "correct_word": "eloquent"
    },
    {
      "sentence": "He was known for his ___ presentations.",
      "blank_position": 20,
      "correct_word": "eloquent"
    }
  ],
  "cached": false
}
```

**cURL Example:**
```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/generate-sentences' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "word": "eloquent",
    "difficulty": "intermediate",
    "userId": "user-uuid"
  }'
```

---

### Generate Image

Generate a memorable image for a word.

**Endpoint:** `/generate-image`

**Method:** POST

**Request Body:**
```json
{
  "word": "mountain",
  "userId": "user-uuid",
  "allowMissingWord": false
}
```

**Response:**
```json
{
  "imageUrl": "https://images.unsplash.com/photo-...",
  "description": "A majestic mountain peak covered in snow",
  "cached": false,
  "note": "Image from Unsplash"
}
```

---

### Generate Audio

Generate pronunciation audio for a word.

**Endpoint:** `/generate-audio`

**Method:** POST

**Request Body:**
```json
{
  "word": "eloquent",
  "wordId": "word-uuid"
}
```

**Response:**
```json
{
  "audioUrl": "https://your-project.supabase.co/storage/v1/object/public/audio/...",
  "cached": false
}
```

---

### Generate Memory Hook

Generate a mnemonic/memory hook for a word.

**Endpoint:** `/generate-memory-hook`

**Method:** POST

**Request Body:**
```json
{
  "word": "eloquent",
  "definition": "Fluent or persuasive in speaking",
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "memoryHook": "Think of 'eloquent' as 'elegant words flowing like water'",
  "cached": false
}
```

---

### Generate Flashcards from Image

Extract words from an image and generate flashcards.

**Endpoint:** `/generate-flashcards-from-image`

**Method:** POST

**Request Body:**
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "userId": "user-uuid",
  "targetLanguage": "en"
}
```

**Response:**
```json
{
  "words": [
    {
      "word": "mountain",
      "definition": "A large natural elevation of earth",
      "context": "Found in image text"
    },
    {
      "word": "summit",
      "definition": "The highest point",
      "context": "Found in image text"
    }
  ],
  "processedImageUrl": "https://...",
  "cached": false
}
```

---

## Error Handling

All API functions return errors in a consistent format:

```typescript
{
  data: null,
  error: {
    message: "Error description",
    code: "ERROR_CODE",
    details: {...}
  }
}
```

**Common Error Codes:**

- `PGRST116`: Row not found
- `23505`: Unique constraint violation
- `42501`: Insufficient permissions
- `23503`: Foreign key violation

**Example Error Handling:**
```typescript
const { data, error } = await getUserWords()

if (error) {
  if (error.code === 'PGRST116') {
    console.log('No words found')
  } else if (error.code === '23505') {
    console.log('Word already exists')
  } else {
    console.error('Unexpected error:', error)
  }
}
```

---

## Rate Limiting

Edge functions have rate limits:

- **Free tier**: 500 requests/day
- **Pro tier**: 100,000 requests/day
- **Enterprise**: Custom limits

**Rate Limit Headers:**
```
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 487
X-RateLimit-Reset: 1640995200
```

---

## Caching

### Client-Side Caching

The application implements caching for:

- **Queue data**: 5 minutes TTL
- **Dashboard stats**: 1 minute TTL
- **Note types**: Session duration

### Edge Function Caching

Edge functions cache results when possible:

- **Sentences**: Cached per word+difficulty
- **Images**: Cached per word
- **Audio**: Cached per word

Cache is stored in Supabase database tables.

---

## Best Practices

### 1. Batch Operations

Instead of multiple single requests:
```typescript
// ❌ Bad
for (const wordId of wordIds) {
  await submitReview({ wordId, button: 'good' })
}

// ✅ Good
await Promise.all(
  wordIds.map(wordId => submitReview({ wordId, button: 'good' }))
)
```

### 2. Error Handling

Always handle errors:
```typescript
const { data, error } = await getUserWords()

if (error) {
  // Show user-friendly message
  toast.error('Failed to load words')
  // Log for debugging
  console.error('API Error:', error)
  return
}

// Proceed with data
processWords(data)
```

### 3. Optimistic Updates

Update UI immediately, rollback on error:
```typescript
// Update UI
setWords(prev => [...prev, newWord])

// Make API call
const { error } = await createWord(newWord)

if (error) {
  // Rollback
  setWords(prev => prev.filter(w => w.id !== newWord.id))
  toast.error('Failed to create word')
}
```

---

## TypeScript Types

All API functions are fully typed. Import types from:

```typescript
import type { Word, Card, Review, StudySession, Desk } from '@/types'
```

---

**Last Updated**: 2025-01-17  
**API Version**: 1.0.0
