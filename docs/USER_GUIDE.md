# Fanki User Guide

Welcome to Fanki! This guide will help you get started and make the most of your flashcard learning experience.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Creating Cards](#creating-cards)
- [Studying](#studying)
- [Organizing with Desks](#organizing-with-desks)
- [Understanding SM-2 Algorithm](#understanding-sm-2-algorithm)
- [Tips for Effective Learning](#tips-for-effective-learning)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [FAQ](#faq)

---

## Getting Started

### Creating Your Account

1. Go to [fanki.app](https://fanki.app)
2. Click **"Sign Up"**
3. Enter your email and password
4. Verify your email address
5. Complete your profile

### Your First Card

After signing up, you'll be guided through creating your first flashcard. Don't worry - you can always edit or delete it later!

---

## Creating Cards

### Basic Cards

The most common card type for vocabulary and simple facts.

1. Click **"Add Word"** or **"+"** button
2. Select **"Basic"** card type
3. Fill in:
   - **Front**: The question (e.g., "What is photosynthesis?")
   - **Back**: The answer (e.g., "The process plants use to convert sunlight into energy")
   - **Extra** (optional): Additional context or pronunciation
4. Click **"Create Card"**

**Tip:** Keep cards simple! One concept per card works best.

### Cloze Deletion Cards

Perfect for learning in context.

**Syntax:**
```
The {{c1::mitochondria}} is the powerhouse of the {{c2::cell}}.
```

**Result:**
- Card 1: "The ___ is the powerhouse of the cell"
- Card 2: "The mitochondria is the powerhouse of the ___"

**Tips:**
- Use `{{c1::answer}}` for deletions
- Multiple deletions with same number appear together
- Great for definitions, formulas, and quotes

### Typing Cards

Requires exact spelling - excellent for language learning.

1. Choose **"Typing Answer"** card type
2. Enter question and answer
3. During study, you must type the answer correctly

**Best for:**
- Vocabulary spelling
- Formula memorization
- Code snippets

### Reverse Cards

Creates two cards from one note (front→back and back→front).

**Example:**
- Card 1: "Dog" → "Perro"
- Card 2: "Perro" → "Dog"

**Enable:** Check "Generate reverse card" when creating a basic card.

---

## Studying

### Starting a Study Session

1. Go to **Dashboard**
2. View your queue breakdown:
   - **Overdue**: Cards past their due date (red)
   - **Due Today**: Cards scheduled for today (yellow)
   - **New Words**: Cards you haven't seen yet (blue)
3. Click **"Start Study Session"**

### Reviewing Cards

When shown a card, you'll see 4 buttons:

#### **Again** (Red)
- Use when: You completely forgot
- Next review: <1 minute
- Effect: Resets progress, card returns to learning phase

#### **Hard** (Orange)
- Use when: You remembered with significant difficulty
- Next review: ~10 minutes
- Effect: Slightly longer interval

#### **Good** (Green)
- Use when: You remembered with minor hesitation
- Next review: ~1-6 days (depends on history)
- Effect: Normal interval increase

#### **Easy** (Blue)
- Use when: You remembered instantly
- Next review: 4+ days
- Effect: Bonus interval multiplier

**Golden Rule:** Be honest! The algorithm works best when you accurately assess your recall.

### Study Modes

Choose different sorting modes in **Study Options**:

- **🎯 Recommended (Shuffled)**: Variety in your review queue
- **⏰ Oldest First**: Tackle overdue cards first
- **😊 Easiest First**: Build momentum with easier cards
- **💪 Hardest First**: Challenge yourself immediately

---

## Organizing with Desks

Desks (decks) help you organize cards by topic.

### Creating a Desk

1. Go to **Desk Manager**
2. Click **"Create New Desk"**
3. Enter:
   - **Name**: e.g., "Spanish Vocabulary"
   - **Description**: Optional details
   - **Color**: Choose a color for easy identification
   - **Icon**: Pick an icon
4. Click **"Create"**

### Assigning Cards to Desks

1. Go to **Word Management**
2. Find your word/card
3. Click the desk icon
4. Select one or more desks
5. Save

### Filtering Study Sessions

1. In Dashboard, click **Desk Selector**
2. Choose a desk
3. Your session will only include cards from that desk

**Tip:** You can assign one card to multiple desks!

---

## Understanding SM-2 Algorithm

Fanki uses the **SuperMemo SM-2** spaced repetition algorithm to optimize your learning.

### How It Works

1. **New cards** start in the learning phase
2. **Learning phase**: Quick reviews (1 min → 10 min)
3. **Graduation**: Move to review phase after 2 successful recalls
4. **Review phase**: Intervals increase exponentially (1d → 6d → 15d → ...)
5. **Lapses**: Failed cards return to learning phase

### Key Concepts

**Ease Factor:**
- Starts at 2.5
- Increases with "Easy" responses
- Decreases with "Hard"/"Again" responses
- Minimum 1.3 (prevents cards from becoming too frequent)

**Interval:**
- Days until next review
- Calculated: `previous_interval × ease_factor`
- Modified by button choice

**Repetitions:**
- Number of consecutive correct reviews
- Resets to 0 on "Again"

### Why It Works

- **Spaced effect**: Longer gaps improve long-term retention
- **Testing effect**: Active recall strengthens memory
- **Personalized**: Adapts to your individual performance

---

## Tips for Effective Learning

### Creating Quality Cards

✅ **DO:**
- Keep cards atomic (one fact each)
- Use cloze deletions for context
- Add images when helpful
- Include pronunciation for vocabulary
- Write in your own words

❌ **DON'T:**
- Create overly complex cards
- Copy-paste long paragraphs
- Use ambiguous questions
- Create cards for information you don't need

### Study Best Practices

1. **Daily Consistency**
   - Study every day, even if only 10 minutes
   - Small, regular sessions beat long cramming

2. **Don't Cherry-Pick**
   - Review all due cards
   - The algorithm knows what you need

3. **Be Honest**
   - Don't mark "Good" if you hesitated significantly
   - Accurate ratings = better scheduling

4. **Use Extra Field**
   - Add context, examples, or mnemonics
   - Helps with understanding, not just memorization

5. **Review Immediately After Learning**
   - Create cards right after learning new material
   - Strike while the iron is hot!

### Overcoming Challenges

**Too Many Overdue Cards?**
- Use "Easiest First" mode to build momentum
- Break into smaller study sessions
- Consider suspending less important cards

**Cards Too Easy?**
- Mark them as "Easy" consistently
- Intervals will increase automatically
- Consider editing to make them more challenging

**Cards Too Hard?**
- Break complex cards into simpler ones
- Add mnemonics in the Extra field
- Use cloze deletions to add context

---

## Keyboard Shortcuts

Speed up your studying with keyboard shortcuts:

### During Study

| Key | Action |
|-----|--------|
| `1` or `Numpad 1` | Again |
| `2` or `Numpad 2` | Hard |
| `3` or `Numpad 3` | Good |
| `4` or `Numpad 4` | Easy |
| `Space` | Show answer / Flip card |
| `Enter` | Good (default action) |
| `Esc` | Pause session |

### Navigation

| Key | Action |
|-----|--------|
| `/` | Search |
| `N` | Add new word |
| `D` | Dashboard |
| `S` | Start session |

**Pro Tip:** Keep your hand on the number keys (1-4) for fastest reviews!

---

## FAQ

### How many cards should I study per day?

**Beginners:** 10-20 new cards/day  
**Intermediate:** 20-50 new cards/day  
**Advanced:** 50+ new cards/day

Start small and increase gradually. Quality > Quantity!

### What's a good retention rate?

**85-95%** is ideal. Higher means cards might be too easy, lower means they're too hard or you need to study more consistently.

### Can I edit cards after creating them?

Yes! Go to **Word Management**, find your card, and click **Edit**. Changes won't affect your review history.

### Can I delete cards?

Yes, but be careful! Deleted cards can't be recovered. Go to **Word Management** → Select card → **Delete**.

### How do I export my data?

Go to **Settings** → **Export Data** → Choose format (JSON, CSV, or Anki).

### Can I import from Anki?

Currently, you can import text files in Anki format. Go to **Settings** → **Import** → Select file.

### Why are some cards appearing multiple times?

You might have multiple card types from one note (e.g., basic + reverse), or the card might be in the re-learning queue after a lapse.

### How do I change my study schedule?

The algorithm automatically adjusts based on your performance. You can't manually set intervals, but your button choices determine the schedule.

### What happens if I miss a day?

Cards become overdue, but don't worry! The algorithm will still work correctly. Just continue studying when you can.

### Can I sync across devices?

Yes! Your data is stored in the cloud. Just log in on any device to access your cards.

### Is there a mobile app?

Currently web-only, but fully responsive. Add to your home screen for an app-like experience!

### How do I get better at recall?

1. Create better cards (atomic, clear, contextual)
2. Study consistently
3. Use active recall (don't just recognize)
4. Get enough sleep
5. Use mnemonics and visualization

---

## Getting Help

### Support Options

- **Documentation**: Check [docs folder](../docs)
- **GitHub Issues**: Report bugs or request features
- **Community**: Join our Discord server
- **Email**: support@fanki.app (if available)

### Useful Resources

- [SM-2 Algorithm Explanation](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [Effective Flashcard Strategies](https://www.gwern.net/Spaced-repetition)
- [Anki Manual](https://docs.ankiweb.net/) (similar principles)

---

## Updates

Stay updated with new features:

- Follow release notes in GitHub
- Enable email notifications (in Settings)
- Check the changelog

---

**Happy Learning! 📚🧠**

Need help? Don't hesitate to reach out to the community or support team.

---

*Last Updated: 2025-01-17*  
*Version: 1.0.0*
