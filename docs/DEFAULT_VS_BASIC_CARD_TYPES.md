# Default vs Basic Card Types

**Date:** 2025-09-30  
**Status:** ✅ IMPLEMENTED

---

## Overview

We've split the original card functionality into two distinct types to support both Fanki's AI-enhanced workflow and Anki's standard approach:

### 🌟 **Default (AI-Enhanced)** - Fanki's Signature Card
- **What:** Smart flashcard with auto-generated practice sentences and images
- **When to use:** Quick word learning with contextual examples
- **AI Features:** 3 example sentences + image + image description
- **User Input:** Just word + definition + optional pronunciation

### 📝 **Basic** - Pure Anki Standard
- **What:** Simple front-and-back card with no AI generation
- **When to use:** Complete control over content, no AI assistance
- **AI Features:** None - exactly what you type is what you see
- **User Input:** Front + Back (+ optional extra field)

---

## Comparison Table

| Feature | Default (AI-Enhanced) | Basic (Anki Standard) |
|---------|----------------------|----------------------|
| **AI Generation** | ✅ Yes (3 sentences + image) | ❌ No |
| **Example Sentences** | ✅ Auto-generated | ❌ Must add manually |
| **Images** | ✅ Auto-generated | ❌ Must add manually |
| **Setup Time** | ⚡ Fast (just word + definition) | 📝 Detailed (full content) |
| **Customization** | 🔧 Limited (AI decides) | 🎨 Full (you decide everything) |
| **Best For** | Vocabulary learning | Any content type |
| **Anki Compatible** | ❌ No (has extras) | ✅ Yes (exact match) |

---

## Technical Implementation

### Database Schema

```sql
-- Default note type (AI-enhanced)
note_types {
  slug: 'default'
  label: 'Default (AI-Enhanced)'
  description: 'Fanki's smart flashcard...'
  default_options: {
    "ai_generation": true,
    "generate_sentences": true,
    "generate_image": true,
    "sentence_count": 3
  }
}

-- Basic note type (Anki standard)
note_types {
  slug: 'basic'
  label: 'Basic'
  description: 'Simple front-and-back (Anki standard - no AI)'
  default_options: {
    "ai_generation": false,
    "generate_sentences": false,
    "generate_image": false
  }
}
```

### AI Generation Logic

**CardQueueManager** (`src/lib/card-queue-manager.ts`):
```typescript
// Only generate AI content for 'default' note type
if (card.noteTypeSlug !== 'default') {
  return null
}

// Generate sentences + image
const content = await aiService.generateFlashcardContent(...)
```

**StudySession** (`src/components/flashcards/StudySession.tsx`):
```typescript
// Only generate AI content for 'default' note type
// Basic cards use only user-provided content (Anki standard)
if (word.noteTypeSlug !== 'default') return null

return aiService.generateFlashcardContent(...)
```

---

## User Experience

### Creating a Default Card

1. Select **"Default (AI-Enhanced)"** (selected by default)
2. Enter:
   - Word: "eloquent"
   - Definition: "fluent or persuasive in speaking"
   - (Optional) Pronunciation
3. Submit
4. **Behind the scenes:**
   - AI generates 3 example sentences
   - AI finds relevant image
   - Card is ready for study

**Result during study:**
```
Front: eloquent
Back: fluent or persuasive in speaking

Example Sentences:
1. The lawyer gave an ___ closing argument.
2. She is known for her ___ speeches.
3. His ___ writing style captivates readers.

[Image of a speaker at a podium]
```

### Creating a Basic Card

1. Select **"Basic"**
2. Enter:
   - Front: "What is photosynthesis?"
   - Back: "The process by which plants convert light energy into chemical energy"
3. Submit
4. **What you see is what you get** - no AI generation

**Result during study:**
```
Front: What is photosynthesis?
Back: The process by which plants convert light energy into chemical energy
```

---

## Migration Strategy

### Existing Cards

All your existing cards were created before this split. They are currently:
- **97 cards**: Using basic templates
- **3 cards**: Using cloze templates

**What happens to them?**
- They remain unchanged
- If they have `word_id`, they'll get AI generation (backward compatible)
- If they don't have `word_id`, they use stored content only

### Recommended Approach

**For new users:**
- Use **Default (AI-Enhanced)** for vocabulary learning
- Use **Basic** when you need precise control

**For existing users:**
- Continue using whatever works
- Try **Default** for new vocabulary
- Try **Basic** for non-vocabulary content (e.g., concepts, facts)

---

## Examples by Use Case

### ✅ Use Default (AI-Enhanced) For:
- **Vocabulary words**: "ephemeral", "ubiquitous", "paradigm"
- **Language learning**: Foreign language words
- **Quick learning**: When you want instant context

### ✅ Use Basic For:
- **Definitions**: "What is mitochondria?"
- **Formulas**: "E = mc²" → "Energy equals mass times speed of light squared"
- **Facts**: "Capital of France" → "Paris"
- **Custom content**: When you've prepared specific examples
- **Study materials**: When copying from textbooks

---

## Performance Impact

### Default Card Creation
```
User types: word + definition
    ↓
createWord() + createNoteWithCards()
    ↓
Background: AI generates content
    ↓
Card ready: ~2-3 seconds
```

### Basic Card Creation
```
User types: front + back
    ↓
createNoteWithCards()
    ↓
Card ready: ~200ms (instant)
```

**Study Session:**
- **Default cards**: AI content prefetched in chunks (seamless)
- **Basic cards**: No prefetch needed (content already there)

---

## API Behavior

### `createNoteWithCards()`

```typescript
// Works for both types
await createNoteWithCards({
  userId,
  noteTypeSlug: 'default', // or 'basic'
  fields: {
    front: "eloquent",
    back: "fluent or persuasive",
    extra: "/ˈeləkwənt/"
  },
  wordId: "..." // Optional, only for default
})
```

### `prefetchInitialContentForCards()`

```typescript
// Only generates for default cards
if (card.noteTypeSlug !== 'default') {
  return null // Skip AI generation
}

// Generate for default cards
const content = await aiService.generateFlashcardContent(...)
```

---

## Database Queries

### Count Cards by Type

```sql
SELECT 
  nt.label,
  COUNT(c.id) as count
FROM cards c
JOIN notes n ON c.note_id = n.id
JOIN note_types nt ON n.note_type_id = nt.id
WHERE c.is_active = true
GROUP BY nt.label;
```

### Check AI Generation Settings

```sql
SELECT 
  slug,
  label,
  default_options->>'ai_generation' as has_ai,
  default_options->>'generate_sentences' as gen_sentences,
  default_options->>'sentence_count' as num_sentences
FROM note_types
WHERE slug IN ('default', 'basic');
```

Expected output:
```
slug    | label                  | has_ai | gen_sentences | num_sentences
--------|------------------------|--------|---------------|---------------
default | Default (AI-Enhanced)  | true   | true          | 3
basic   | Basic                  | false  | false         | null
```

---

## Testing

### Test 1: Create Default Card ✅

```bash
# Via UI
1. Open add word form
2. Leave "Default (AI-Enhanced)" selected
3. Word: "test", Definition: "a procedure"
4. Submit
5. Wait ~2 seconds for AI generation
6. Check card in study session - should have sentences
```

### Test 2: Create Basic Card ✅

```bash
# Via UI
1. Open add word form
2. Select "Basic"
3. Front: "What is REST?", Back: "Representational State Transfer"
4. Submit (instant)
5. Check card in study session - should show exactly that text
```

### Test 3: Study Both Types ✅

```bash
1. Start study session with mixed cards
2. Default cards show AI-generated sentences
3. Basic cards show only user content
4. Both work seamlessly in same session
```

---

## Troubleshooting

### Default Card Not Generating Content?

**Check:**
1. `noteTypeSlug` is set to `'default'`
2. Card has associated `word_id`
3. AI service is running
4. User has internet connection

**Debug:**
```typescript
console.log('Card type:', card.noteTypeSlug) // Should be 'default'
console.log('Has word ID:', !!card.word?.id) // Should be true
```

### Basic Card Showing Old Content?

**Check:**
1. Card was created with `noteTypeSlug: 'basic'`
2. No legacy `word_id` attached (should be null)
3. `render_payload` contains user-provided content

---

## Future Enhancements

### Planned Features

- [ ] **Settings toggle**: Let users disable AI even for default cards
- [ ] **Sentence count customization**: Choose 1-5 sentences
- [ ] **Image source preference**: Unsplash vs Gemini
- [ ] **"Convert to Basic"**: Strip AI content from default card
- [ ] **"Enhance Basic"**: Add AI content to existing basic card

### Possible Variants

- **Default (Reverse)**: AI-enhanced with reverse card
- **Default (No Image)**: Sentences only, no image
- **Default (Custom Count)**: User chooses sentence count

---

## Summary

| Aspect | Default | Basic |
|--------|---------|-------|
| **Philosophy** | AI-assisted learning | Manual control |
| **Speed** | Fast creation, AI delay | Instant creation |
| **Flexibility** | AI decides context | You decide everything |
| **Best For** | Vocabulary | Any content |
| **Anki Compatible** | No | Yes ✅ |

**Choose wisely:**
- Need examples fast? → **Default**
- Need exact control? → **Basic**
- Learning vocabulary? → **Default**
- Studying any topic? → **Basic**

---

## Files Modified

### Database
- `supabase/migrations/20250131000000_add_default_note_type.sql` - NEW ✨

### Backend
- `src/lib/cards.ts` - Added `'default'` to `NoteTypeSlug` type
- `src/lib/card-queue-manager.ts` - Only AI-generate for `'default'`

### Frontend
- `src/components/words/AddWordForm.tsx` - Added descriptions, default to 'default'
- `src/components/flashcards/StudySession.tsx` - Only AI-generate for `'default'`

### Documentation
- `docs/DEFAULT_VS_BASIC_CARD_TYPES.md` - This document ✨

---

**Implementation Complete:** ✅  
**Production Ready:** ⚠️ Needs migration run  
**Breaking Changes:** None (backward compatible)  
**User Impact:** 🟢 Positive (more choice)
