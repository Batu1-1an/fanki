# Quick Start: Phase 4 Component Migration

## 🎯 You Are Here

✅ Phase 1-3 Complete  
→ **Phase 4: Component Migration** ← START HERE  
⏸️ Phase 5-6: Testing & Rollout

---

## 🚀 Quick Start (5 Minutes)

### **Step 1: Update `src/lib/reviews.ts`** ✅ ALREADY DONE
The client functions are ready:
- `getDueCards(limit, sort, deskId)` - Fetch cards
- `getDueCardCounts(deskId)` - Get statistics

### **Step 2: Test Database Functions** (Optional)
```typescript
// Test in your browser console or a test file
import { getDueCards, getDueCardCounts } from '@/lib/reviews'

const { data: cards } = await getDueCards(5, 'recommended')
console.log('Cards:', cards)

const { totalDue, overdue, dueToday, newCards } = await getDueCardCounts()
console.log('Counts:', { totalDue, overdue, dueToday, newCards })
```

### **Step 3: Start Component Migration**
Pick ONE component to start with:

**Option A: StudySession.tsx** (RECOMMENDED - Core functionality)
- Most critical component
- Highest complexity but highest impact
- See detailed guide below

**Option B: TodaysCards.tsx** (EASIER - Good warmup)
- Simpler component
- Good way to learn the pattern
- Less risky

---

## 📝 StudySession.tsx Migration (Detailed)

### **Current File Location**
`src/components/flashcards/StudySession.tsx`

### **Step-by-Step Changes**

#### **1. Update Imports** (30 seconds)
```typescript
// FIND:
import { QueuedWord } from '@/lib/queue-manager'
import { generateStudySession } from '@/lib/queue-manager'

// REPLACE WITH:
import { QueuedCard } from '@/types'
import { generateCardStudySession } from '@/lib/card-queue-manager'
```

#### **2. Update State Types** (1 minute)
```typescript
// FIND:
const [sessionWords, setSessionWords] = useState<QueuedWord[]>([])
const [currentWordIndex, setCurrentWordIndex] = useState(0)

// REPLACE WITH:
const [sessionCards, setSessionCards] = useState<QueuedCard[]>([])
const [currentCardIndex, setCurrentCardIndex] = useState(0)
```

#### **3. Update Session Generation** (2 minutes)
```typescript
// FIND:
const { words, sessionId } = await generateStudySession({
  maxWords: 20,
  sortOrder,
  deskId
})
setSessionWords(words)

// REPLACE WITH:
const { cards, sessionId } = await generateCardStudySession({
  maxCards: 20,
  sortOrder,
  deskId
})
setSessionCards(cards)
```

#### **4. Add Template Rendering** (10 minutes)
```typescript
// ADD THIS NEW COMPONENT:
const CardRenderer: React.FC<{
  card: QueuedCard
  onReview: (button: string) => void
}> = ({ card, onReview }) => {
  // For now, all cards render as flashcards
  // Future: Add cloze, basic, etc.
  return (
    <FlashcardComponent
      word={card.word?.word || ''}
      definition={card.word?.definition || ''}
      sentences={card.sentences}
      imageUrl={card.imageUrl}
      onReview={onReview}
    />
  )
}

// THEN IN RENDER:
// FIND:
<FlashcardComponent word={currentWord} ... />

// REPLACE WITH:
<CardRenderer card={sessionCards[currentCardIndex]} onReview={handleReview} />
```

#### **5. Update Review Submission** (2 minutes)
```typescript
// FIND:
await submitReview({
  wordId: currentWord.id,
  flashcardId: currentWord.flashcard?.id,
  button
})

// REPLACE WITH:
await submitReview({
  wordId: currentCard.word?.id || '',
  flashcardId: null, // Deprecated in card system
  button,
  cardId: currentCard.cardId // NEW: Primary identifier
})
```

**Note**: You'll need to update `submitReview()` to accept `cardId` parameter.

#### **6. Update Progress Tracking** (1 minute)
```typescript
// FIND all instances of:
sessionWords.length
currentWordIndex

// REPLACE WITH:
sessionCards.length
currentCardIndex
```

### **Expected Time: 20-30 minutes**

---

## 🧪 Testing Checklist

After migrating a component:

- [ ] Component renders without errors
- [ ] Cards load correctly
- [ ] Review buttons work
- [ ] Progress tracking updates
- [ ] Session completes successfully
- [ ] No console errors
- [ ] Data saves to database

---

## 📋 Component Priority Order

| Component | Priority | Time | Complexity | Status |
|-----------|----------|------|------------|--------|
| StudySession.tsx | ⚡ HIGH | 4-6h | 🔴 High | 🔜 NEXT |
| ReviewDashboard.tsx | ⚡ HIGH | 2-3h | 🟡 Medium | ⏸️ |
| TodaysCards.tsx | 🔸 MEDIUM | 2-3h | 🟡 Medium | ⏸️ |
| StudySessionDashboard.tsx | 🔸 MEDIUM | 1-2h | 🟢 Low | ⏸️ |
| DashboardClient.tsx | 🔹 LOW | 1h | 🟢 Low | ⏸️ |

---

## 🆘 Common Issues & Fixes

### **Issue 1: "Cannot read property 'word' of undefined"**
**Cause**: Card doesn't have word data  
**Fix**: Always check `card.word?.word` with optional chaining

### **Issue 2: "submitReview is missing cardId parameter"**
**Cause**: Function signature not updated  
**Fix**: Add `cardId?: string` to `submitReview()` parameters

### **Issue 3: "Template slug 'cloze' not recognized"**
**Cause**: Template renderer doesn't handle all types yet  
**Fix**: Add fallback to default renderer

### **Issue 4: TypeScript errors on QueuedCard"**
**Cause**: Missing imports  
**Fix**: Import from `@/types` not `@/lib/queue-manager`

---

## 📚 Reference Documents

**Need detailed examples?**
- See `COMPONENT_MIGRATION_GUIDE.md` (500+ lines with code)

**Need architecture context?**
- See `CARD_MIGRATION_SUMMARY.md` (technical deep-dive)

**Need database details?**
- See `PHASE_2_DATABASE_COMPLETE.md` (DB functions, testing)

**Need executive overview?**
- See `MIGRATION_EXECUTIVE_SUMMARY.md` (high-level summary)

---

## 🎯 Success Criteria for Phase 4

- [ ] All 5 components migrated
- [ ] All components tested manually
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] No runtime errors in console
- [ ] Study flow works end-to-end
- [ ] Data persists correctly
- [ ] Performance maintained (<2s session start)

---

## 💡 Pro Tips

1. **Start small**: Do TodaysCards.tsx first to learn the pattern
2. **Test frequently**: After each file save, check the browser
3. **Use console.log**: Debug card data structure as needed
4. **Keep backups**: Git commit before each component
5. **One at a time**: Don't migrate multiple components simultaneously

---

## 🚦 Migration Pattern (Repeat for Each Component)

```
1. Update imports (QueuedWord → QueuedCard)
2. Update state types (sessionWords → sessionCards)
3. Update data fetching (generateStudySession → generateCardStudySession)
4. Update rendering (add template logic if needed)
5. Update event handlers (use card.cardId instead of word.id)
6. Test in browser
7. Fix any TypeScript errors
8. Git commit
9. Move to next component
```

---

## 🎉 When You're Done

After completing Phase 4:

1. Run `npm run build` - Should succeed
2. Run `npm run lint` - Should pass
3. Test study flow end-to-end
4. Create a summary of what was changed
5. Move to Phase 5 (Testing & Validation)

---

## 📞 Need Help?

**Stuck on a specific component?**
- Check `COMPONENT_MIGRATION_GUIDE.md` for that component

**TypeScript errors?**
- Make sure you're importing from `@/types`
- Check that all optional chaining (`?.`) is in place

**Runtime errors?**
- Add console.log to see card structure
- Verify database functions are returning data

**Performance issues?**
- Check that chunked pre-fetching is still working
- Verify indexes are being used (see Phase 2 doc)

---

*Quick Start Guide*  
*Phase: 4 - Component Migration*  
*Estimated Time: 8-12 hours total*  
*Start With: StudySession.tsx or TodaysCards.tsx*  
*Date: 2025-01-29*
