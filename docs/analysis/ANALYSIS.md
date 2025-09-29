
# Analysis of Card Counting Logic

## Summary

There was a logical discrepancy between the card counts displayed on the main dashboard and the counts shown in the "Today's Cards" section. This was because the main dashboard used an efficient query to get the *true* counts of all due cards, while the "Today's Cards" section was only fetching a *sample* of 50 cards and then recalculating the counts based on that limited sample.

This led to a confusing user experience where the dashboard might show a large number of overdue cards, but the user would only see a fraction of them when they went to study.

## The Problem in Detail

1.  **`StudySessionDashboard.tsx`** is the main component for the dashboard.
2.  In its `loadDashboardData` function, it calls two different functions from `src/lib/reviews.ts`:
    *   `getDueWordCounts()`: This function efficiently queries the database to get the *total number* of overdue, due today, and new cards. These numbers are used to populate the main dashboard statistics.
    *   `getDueWords(50, 'recommended')`: This function fetches a limited sample of only 50 cards. This sample is then passed to the `TodaysCards` component.
3.  **`TodaysCards.tsx`** receives the 50-card sample.
4.  It then runs its own `groupCardsByPriority` function, which re-calculates the overdue, due today, and new card counts based *only* on the 50 cards it received.

This process guarantees that the counts in `TodaysCards` will be incorrect whenever the actual number of due cards exceeds 50.

## The Solution

To fix this, the limit on the `getDueWords` function call in `StudySessionDashboard.tsx` was increased from `50` to `1000`.

**File:** `src/components/dashboard/StudySessionDashboard.tsx`

**Change:**

```typescript
// Before
const { data: sampleCards } = await getDueWords(50, 'recommended');

// After
const { data: sampleCards } = await getDueWords(1000, 'recommended');
```

This ensures that, for the vast majority of users, all due cards will be fetched and displayed correctly in the `TodaysCards` component, aligning the counts with the main dashboard statistics.

### Future Considerations

While increasing the limit to 1000 solves the immediate problem, a more robust long-term solution would be to implement pagination. This would involve:

1.  Keeping the initial fetch small (e.g., 50 cards).
2.  Passing the *true* counts (from `getDueWordCounts`) to the `TodaysCards` component.
3.  Adding a "Load More" button or infinite scrolling to the lists within `TodaysCards` to fetch additional pages of due cards as needed.

This would provide the best balance of performance and data accuracy.
