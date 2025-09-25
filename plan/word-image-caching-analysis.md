# Word Image Generation & Caching Assessment

## Current Architecture

- **Image generation entrypoint**: `supabase/functions/generate-image/index.ts` handles Gemini image requests via Supabase Edge Functions. It validates the payload, fetches the requesting user’s `word_id`, and either returns cached results or calls Gemini.
- **Client invocation**: `src/lib/ai-services.ts` exposes `aiService.generateImage()` that invokes the Edge Function and surfacing its `{ imageUrl, description, cached }` response to React components.
- **UI workflow**: `src/components/words/AddWordForm.tsx` triggers `aiService.generateImage()` when the user selects the Gemini source while creating a word and then persists the returned asset via `aiService.saveFlashcard()`.

## Cache Behavior Today

- **Per-user lookup**: The Edge Function first queries `words` with `.eq('word', word.toLowerCase()).eq('user_id', userId)`; cache eligibility depends on a match for the same user.
- **Local cache hit**: If the user owns the word, the function searches `flashcards` for the latest `image_url` tied to that `word_id`. A cached asset is returned when `generated_at` is within 30 days.
- **Cache miss path**: When no per-user entry exists—or the asset is older than 30 days—the function calls Gemini, uploads the result to the `flashcard-images` storage bucket, and upserts a record into `flashcards` for that specific user.
- **Client persistence**: `aiService.saveFlashcard()` ensures the generated data is stored with the user’s own `word_id`, keeping all artifacts user-scoped.

## Identified Gaps

- **No global reuse**: Because both the lookup and storage layers are keyed by the requesting user’s `word_id`, other users never benefit from existing imagery even for identical vocabulary.
- **Limited TTL flexibility**: The 30-day freshness window is hard-coded, making cache invalidation policy changes dependent on code updates.
- **Lack of metadata auditing**: There is no canonical record of who generated a given image first, what prompt variant was used, or how many times an image has been reused—all useful for future governance.

## Recommended Enhancements

- **Introduce normalized word cache**: Add a `normalized_word` key (e.g., lowercase, trimmed, diacritics stripped) and persist globally shared assets in a dedicated table such as `global_word_images` or in a `flashcard-images/global/` storage prefix.
- **Implement read-through logic**: Update the Edge Function to check the global cache before user-specific records. If a fresh global asset exists, return it immediately and optionally mirror it into the requester’s `flashcards` row for consistency.
- **Add write-through updates**: When generating a new image, upsert the result into both the global cache (keyed by `normalized_word`) and the user-level cache. Decide whether later regenerations overwrite the global record or create versions.
- **Parameterize freshness**: Replace the hard-coded 30-day threshold with a configuration value (environment variable or database column) so cache policies can evolve without redeployments.
- **Capture provenance metadata**: Store fields like `generated_by_user_id`, `prompt_version`, `model_name`, and `last_used_at` to enable auditing and experiment tracking.

## Implementation Considerations

- **Backfill strategy**: Run a migration or background job to populate the new global cache from high-frequency words once the schema is ready.
- **Conflict resolution**: Decide how to arbitrate conflicting regenerations—for example, allow users to overwrite the global cache, require admin approval, or maintain multiple variants with ranking.
- **Storage access patterns**: If using Supabase Storage, ensure the public URL path remains stable while supporting private buckets when necessary for licensing.
- **Client compatibility**: Because the Edge Function response contract stays the same (`{ imageUrl, description, cached }`), existing React components should not require changes after the backend is upgraded.

## Next Steps

- **Design review**: Align on global cache schema, TTL policy, and overwrite rules.
- **Database migration**: Create the `global_word_images` table (or equivalent) with indexes on `normalized_word` and relevant metadata.
- **Edge Function upgrade**: Implement the read-through/write-through logic, add configuration for TTL, and extend logging.
- **Operational monitoring**: Instrument metrics (hit rate, regeneration counts, latency) and alerting to validate the benefit of global caching post-launch.
