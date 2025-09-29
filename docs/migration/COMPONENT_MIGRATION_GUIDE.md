# Component Migration Guide: Word → Card System

## Overview

This guide provides step-by-step instructions for migrating components from the word-based queue system to the new card-based system. Each component migration is independent and can be done incrementally.

---

## General Migration Pattern

### **Before (Word-Based)**
```typescript
import { QueuedWord } from '@/lib/queue-manager'
import { generateStudySession, getQueueManager } from '@/lib/queue-manager'

// Fetch words
const { words } = await generateStudySession({ maxWords: 20 })

// Render based on word
<FlashcardComponent word={word} />
```

### **After (Card-Based)**
```typescript
import { QueuedCard } from '@/types'
import { generateCardStudySession, getCardQueueManager } from '@/lib/card-queue-manager'

// Fetch cards
const { cards } = await generateCardStudySession({ maxCards: 20 })

// Render based on template
{card.templateSlug === 'front-back' ? (
  <FrontBackCard card={card} />
) : card.templateSlug === 'cloze' ? (
  <ClozeCard card={card} />
) : (
  <DefaultCard card={card} />
)}
```

---

## Component 1: StudySession.tsx

**Priority**: ⚡ **CRITICAL** - Core study loop  
**Complexity**: 🔴 High  
**Dependencies**: None

### Current State
- Uses `QueuedWord[]` from `generateStudySession()`
- Hardcoded flashcard rendering
- Word-centric review submission

### Migration Steps

#### Step 1: Update Imports
```typescript
// Before
import { QueuedWord } from '@/lib/queue-manager'
import { generateStudySession } from '@/lib/queue-manager'

// After
import { QueuedCard } from '@/types'
import { generateCardStudySession } from '@/lib/card-queue-manager'
```

#### Step 2: Update State Types
```typescript
// Before
const [sessionWords, setSessionWords] = useState<QueuedWord[]>([])
const [currentWordIndex, setCurrentWordIndex] = useState(0)
const currentWord = sessionWords[currentWordIndex]

// After
const [sessionCards, setSessionCards] = useState<QueuedCard[]>([])
const [currentCardIndex, setCurrentCardIndex] = useState(0)
const currentCard = sessionCards[currentCardIndex]
```

#### Step 3: Update Session Generation
```typescript
// Before
const { words, sessionId, estimatedTimeMinutes } = await generateStudySession({
  maxWords: 20,
  sortOrder,
  deskId
})
setSessionWords(words)

// After
const { cards, sessionId, estimatedTimeMinutes } = await generateCardStudySession({
  maxCards: 20,
  sortOrder,
  deskId
})
setSessionCards(cards)
```

#### Step 4: Add Template Rendering Logic
```typescript
// Create a new component for template routing
const CardRenderer: React.FC<{ card: QueuedCard, onReview: (button: string) => void }> = ({ card, onReview }) => {
  // Route based on template slug
  switch (card.templateSlug) {
    case 'front-back':
    case 'basic-word':
      return <FlashcardComponent 
        word={card.word?.word || ''}
        definition={card.word?.definition || ''}
        sentences={card.sentences}
        imageUrl={card.imageUrl}
        onReview={onReview}
      />
    
    case 'cloze':
      // Future: Render cloze-style card
      return <ClozeCardComponent card={card} onReview={onReview} />
    
    case 'basic':
      // Future: Render basic front/back
      return <BasicCardComponent card={card} onReview={onReview} />
    
    default:
      console.warn(`Unknown template: ${card.templateSlug}`)
      return <DefaultCardComponent card={card} onReview={onReview} />
  }
}

// In render
<CardRenderer 
  card={currentCard} 
  onReview={handleReviewButton}
/>
```

#### Step 5: Update Review Submission
```typescript
// Before
await submitReview({
  wordId: currentWord.id,
  flashcardId: currentWord.flashcard?.flashcard.id,
  button,
  responseTimeMs: elapsedTime
})

// After
await submitReview({
  wordId: currentCard.word?.id || '', // Keep for backward compat
  flashcardId: null, // Deprecated in card system
  button,
  responseTimeMs: elapsedTime,
  cardId: currentCard.cardId // NEW - primary identifier
})
```

#### Step 6: Update Chunked Pre-fetching
```typescript
// The chunked pre-fetching logic needs card IDs instead of word IDs

// Before
const chunkIndex = Math.floor(currentWordIndex / CHUNK_SIZE)

// After
const chunkIndex = Math.floor(currentCardIndex / CHUNK_SIZE)

// When fetching chunk content
const chunkCards = sessionCards.slice(startIdx, endIdx)
const cardsNeedingContent = chunkCards.filter(card => !card.sentences || !card.imageUrl)

// Fetch content for cards
for (const card of cardsNeedingContent) {
  if (!card.word?.word) continue
  
  const content = await aiService.generateFlashcardContent(
    card.word.word,
    difficulty,
    userId
  )
  
  // Update the card in enrichedCards state
  setEnrichedCards(prev => prev.map(c => 
    c.cardId === card.cardId 
      ? { ...c, sentences: content.sentences, imageUrl: content.imageUrl }
      : c
  ))
}
```

### Testing Checklist
- [ ] Session starts with cards
- [ ] Card content renders correctly
- [ ] Review buttons work
- [ ] Progress tracking updates
- [ ] Session completion works
- [ ] Re-learning queue functions
- [ ] Different templates render (when available)

---

## Component 2: ReviewDashboard.tsx

**Priority**: ⚡ **HIGH** - Entry point for study  
**Complexity**: 🟡 Medium  
**Dependencies**: StudySession.tsx should be migrated first

### Current State
- Starts study sessions with `generateStudySession()`
- Shows queue statistics from word-based manager
- Desk filtering for words

### Migration Steps

#### Step 1: Update Imports
```typescript
// Before
import { generateStudySession, getQueueManager } from '@/lib/queue-manager'
import type { QueuedWord } from '@/lib/queue-manager'

// After
import { generateCardStudySession, getCardQueueManager } from '@/lib/card-queue-manager'
import type { QueuedCard } from '@/types'
```

#### Step 2: Update State
```typescript
// Before
const [isStartingSession, setIsStartingSession] = useState(false)
const [sortOrder, setSortOrder] = useState<'recommended' | 'oldest' | 'easiest' | 'hardest'>('recommended')

// After (same, but for clarity)
const [isStartingSession, setIsStartingSession] = useState(false)
const [sortOrder, setSortOrder] = useState<'recommended' | 'oldest' | 'easiest' | 'hardest'>('recommended')
```

#### Step 3: Update Session Start Handler
```typescript
// Before
const handleStartSession = async () => {
  setIsStartingSession(true)
  try {
    const session = await generateStudySession({
      maxWords: 20,
      sortOrder,
      deskId: selectedDeskId === 'all' ? undefined : selectedDeskId
    })
    
    if (session.words.length === 0) {
      toast.error('No words due for review')
      return
    }
    
    router.push(`/study?session=${session.sessionId}`)
  } finally {
    setIsStartingSession(false)
  }
}

// After
const handleStartSession = async () => {
  setIsStartingSession(true)
  try {
    const session = await generateCardStudySession({
      maxCards: 20,
      sortOrder,
      deskId: selectedDeskId === 'all' ? undefined : selectedDeskId
    })
    
    if (session.cards.length === 0) {
      toast.error('No cards due for review')
      return
    }
    
    router.push(`/study?session=${session.sessionId}`)
  } finally {
    setIsStartingSession(false)
  }
}
```

#### Step 4: Update Queue Stats Display
```typescript
// Before
const queueManager = getQueueManager()
const { stats } = await queueManager.generateQueue({ maxWords: 100 })

// After
const queueManager = getCardQueueManager()
const { stats } = await queueManager.generateQueue({ maxCards: 100 })

// Stats structure is the same:
// - stats.total
// - stats.overdue
// - stats.dueToday
// - stats.newCards (was newWords)
// - stats.averageDifficulty
```

### Testing Checklist
- [ ] Start session button works
- [ ] Queue statistics display correctly
- [ ] Desk filtering applies
- [ ] Sort order selector works
- [ ] Loading states show appropriately
- [ ] Error handling works

---

## Component 3: StudySessionDashboard.tsx

**Priority**: 🔸 **MEDIUM** - Stats display  
**Complexity**: 🟢 Low  
**Dependencies**: None (just reads stats)

### Current State
- Displays queue breakdown
- Shows overdue/due today/new counts
- Uses word-based queue stats

### Migration Steps

#### Step 1: Update Stats Fetching
```typescript
// Before
import { getDueWords, getLearningWords } from '@/lib/reviews'

const { data: dueWords } = await getDueWords(5000, 'recommended')
const learningCount = dueWords?.filter(w => w.status === 'learning').length || 0

// After
import { getDueCards } from '@/lib/reviews'

const { data: dueCards } = await getDueCards(5000, 'recommended')
const learningCount = dueCards?.filter(c => c.reviewStatus === 'learning').length || 0
```

#### Step 2: Update Count Logic
```typescript
// Before
const overdueWords = dueWords?.filter(w => {
  const dueDateStr = w.lastReview?.due_date?.split('T')[0]
  return dueDateStr < todayStr
}).length || 0

// After
const overdueCards = dueCards?.filter(c => c.reviewStatus === 'overdue').length || 0
// Review status is pre-computed by the database/mapping function
```

#### Step 3: Update Display Labels
```typescript
// Update any "words" terminology to "cards" where appropriate
// For user-facing text, "cards" is more accurate with multi-template support

<p className="text-sm text-muted-foreground">
  {stats.overdue} overdue cards, {stats.dueToday} due today
</p>
```

### Testing Checklist
- [ ] Counts display correctly
- [ ] Overdue count accurate
- [ ] Due today count accurate
- [ ] New cards count accurate
- [ ] Updates after completing reviews
- [ ] Desk filtering works

---

## Component 4: TodaysCards.tsx

**Priority**: 🔸 **MEDIUM** - Today's card list  
**Complexity**: 🟡 Medium  
**Dependencies**: None

### Current State
- Lists today's due words
- Shows word metadata
- Allows starting session with selected words

### Migration Steps

#### Step 1: Update Data Fetching
```typescript
// Before
const { data: todaysWords } = await getDueWords(100, 'recommended')
const dueToday = todaysWords?.filter(w => {
  const dueDateStr = w.lastReview?.due_date?.split('T')[0]
  return dueDateStr === todayStr
})

// After
const { data: todaysCards } = await getDueCards(100, 'recommended')
const dueToday = todaysCards?.filter(c => c.reviewStatus === 'due_today')
```

#### Step 2: Update Card Display
```typescript
// Before
{todaysWords.map(word => (
  <div key={word.id} className="card-item">
    <h3>{word.word}</h3>
    <p>{word.definition}</p>
    <Badge>{word.status}</Badge>
  </div>
))}

// After
{todaysCards.map(card => (
  <div key={card.cardId} className="card-item">
    <h3>{card.word?.word || 'Card'}</h3>
    <p>{card.word?.definition || ''}</p>
    <Badge>{card.templateSlug}</Badge>
    <Badge variant="outline">{card.reviewStatus}</Badge>
  </div>
))}
```

#### Step 3: Update Selection Logic
```typescript
// Before
const [selectedWordIds, setSelectedWordIds] = useState<string[]>([])

const handleStartSession = () => {
  router.push(`/study?wordIds=${selectedWordIds.join(',')}`)
}

// After
const [selectedCardIds, setSelectedCardIds] = useState<string[]>([])

const handleStartSession = () => {
  router.push(`/study?cardIds=${selectedCardIds.join(',')}`)
}

// Note: Study session needs to handle cardIds query param
```

### Testing Checklist
- [ ] Today's cards list correctly
- [ ] Card metadata displays
- [ ] Selection works
- [ ] Start session with selection
- [ ] Empty state shows when no cards

---

## Component 5: DashboardClient.tsx & StudyDashboard.tsx

**Priority**: 🔹 **LOW** - Overview display  
**Complexity**: 🟢 Low  
**Dependencies**: StudySessionDashboard.tsx

### Current State
- Overview dashboard
- Shows general stats
- Embeds StudySessionDashboard

### Migration Steps

#### Step 1: Update Stats Fetching
```typescript
// Before
import { getDueWordCounts } from '@/lib/reviews'

const { totalDue, overdue, dueToday, newWords } = await getDueWordCounts(deskId)

// After
import { getDueCardCounts } from '@/lib/reviews' // Need to create this

const { totalDue, overdue, dueToday, newCards } = await getDueCardCounts(deskId)
```

#### Step 2: Update Display
```typescript
// Just rename variables from "words" to "cards"
<StatCard 
  title="Due Today" 
  value={dueToday} 
  subtitle={`${newCards} new cards`}
/>
```

### Testing Checklist
- [ ] Stats display correctly
- [ ] Dashboard loads fast
- [ ] Embedded components work
- [ ] Navigation works

---

## Database Function Needed

Before components can fully migrate, create this PostgreSQL function:

```sql
CREATE OR REPLACE FUNCTION get_due_cards_optimized(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_sort_order TEXT DEFAULT 'recommended'
)
RETURNS TABLE(
  card_id UUID,
  note_id UUID,
  note_type_slug TEXT,
  template_slug TEXT,
  review_status TEXT,
  ease_factor DECIMAL,
  interval_days INTEGER,
  repetitions INTEGER,
  due_date TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  last_quality INTEGER,
  render_payload JSONB,
  fields JSONB,
  word_id UUID,
  word TEXT,
  definition TEXT,
  pronunciation TEXT,
  difficulty INTEGER,
  word_status TEXT,
  word_created_at TIMESTAMPTZ,
  word_updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS card_id,
    c.note_id,
    nt.slug AS note_type_slug,
    ct.slug AS template_slug,
    -- Compute review status
    CASE
      WHEN lr.id IS NULL THEN 'new'
      WHEN lr.due_date < NOW() AND lr.reviewed_at::date < CURRENT_DATE THEN 'overdue'
      WHEN lr.due_date::date = CURRENT_DATE AND lr.reviewed_at::date < CURRENT_DATE THEN 'due_today'
      WHEN lr.reviewed_at::date = CURRENT_DATE THEN 'completed_today'
      WHEN lr.due_date > NOW() THEN 'future'
      ELSE 'inactive'
    END AS review_status,
    lr.ease_factor,
    lr.interval_days,
    lr.repetitions,
    lr.due_date,
    lr.reviewed_at AS last_reviewed_at,
    lr.quality AS last_quality,
    c.render_payload,
    n.fields,
    -- Word info (if applicable)
    w.id AS word_id,
    w.word,
    w.definition,
    w.pronunciation,
    w.difficulty,
    w.status AS word_status,
    w.created_at AS word_created_at,
    w.updated_at AS word_updated_at
  FROM cards c
  JOIN notes n ON c.note_id = n.id
  JOIN note_types nt ON n.note_type_id = nt.id
  JOIN card_templates ct ON c.template_id = ct.id
  LEFT JOIN words w ON n.source_word_id = w.id
  LEFT JOIN LATERAL (
    SELECT *
    FROM reviews r
    WHERE r.card_id = c.id AND r.user_id = p_user_id
    ORDER BY r.reviewed_at DESC
    LIMIT 1
  ) lr ON true
  WHERE n.user_id = p_user_id
    AND (
      lr.id IS NULL -- New cards
      OR lr.due_date <= NOW() + INTERVAL '1 day' -- Due today or overdue
    )
  ORDER BY
    CASE p_sort_order
      WHEN 'oldest' THEN lr.due_date
      WHEN 'easiest' THEN -lr.ease_factor
      WHEN 'hardest' THEN lr.ease_factor
      ELSE RANDOM() -- recommended = shuffled
    END
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## Common Pitfalls

### ❌ **Pitfall 1: Assuming Word Always Exists**
```typescript
// BAD
const wordText = card.word.word // Crashes if no word

// GOOD
const wordText = card.word?.word || 'Unknown'
```

### ❌ **Pitfall 2: Hardcoding Template Logic**
```typescript
// BAD - Doesn't scale
if (card.templateSlug === 'front-back') { /* ... */ }

// GOOD - Extensible
const TemplateRenderer = templateRenderers[card.templateSlug] || DefaultRenderer
return <TemplateRenderer card={card} />
```

### ❌ **Pitfall 3: Not Handling Missing AI Content**
```typescript
// BAD
const sentence = card.sentences[0] // Crashes if not pre-fetched

// GOOD
const sentence = card.sentences?.[0] || null
if (!sentence) {
  return <LoadingSpinner />
}
```

### ❌ **Pitfall 4: Forgetting card_id in Reviews**
```typescript
// BAD - Old word-only approach
await submitReview({ wordId, button })

// GOOD - Include card_id
await submitReview({ wordId, cardId: card.cardId, button })
```

---

## Rollout Strategy

### **Phase 1: Parallel Deployment** ✅
- New card system runs alongside word system
- No user impact
- Test thoroughly in dev

### **Phase 2: Gradual Migration**
1. Enable card system for 10% of users (feature flag)
2. Monitor for errors
3. Increase to 50% if stable
4. Full rollout

### **Phase 3: Deprecation**
- After 2 weeks of stable card system
- Remove word-based code
- Celebrate! 🎉

---

## Monitoring

### **Metrics to Track**
- Card fetch latency
- Session start time
- Review submission success rate
- AI content generation time
- Error rates by template type

### **Alerts to Set**
- Card fetch > 2 seconds
- Review submission errors > 1%
- AI content failures > 5%

---

## Rollback Plan

If critical issues arise:

1. **Feature Flag OFF** - Revert to word system instantly
2. **Database OK** - Cards table unchanged, no data loss
3. **User Impact** - Minimal, just switches back to old UI
4. **Time to Rollback** - < 5 minutes

---

## FAQ

**Q: Do I need to migrate all components at once?**  
A: No! Start with StudySession.tsx, then do others incrementally.

**Q: What if a card doesn't have a word?**  
A: Future non-word cards (like pure text flashcards) won't have `card.word`. Always check `card.word?.word`.

**Q: How do I test different templates?**  
A: Initially all cards will be 'front-back' or 'basic-word'. Test template branching with mock data first.

**Q: What happens to existing reviews?**  
A: They stay in the database. The `reviews` table already has `card_id` column, we just start using it.

**Q: Can I run both systems in production?**  
A: Yes, via feature flags. Useful for gradual rollout.

---

## Success Metrics

- ✅ All components migrated
- ✅ No user-reported bugs for 1 week
- ✅ Session start time < 2 seconds
- ✅ Review flow feels identical to users
- ✅ Ready to add new card templates

---

*Generated: 2025-01-29*  
*Status: Ready for Component Migration*
