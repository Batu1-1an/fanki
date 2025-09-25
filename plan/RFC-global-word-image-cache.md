---
title: "RFC-00X: Global Word Image Cache"
author: "Your Name"
reviewers:
  - "Backend Lead"
  - "Platform Engineer"
  - "Product Manager"
created: "2025-09-26"
status: "Draft"
---

# Summary

Implement a globally shared cache for AI-generated flashcard imagery keyed by normalized word text. The change reduces duplicate Gemini calls, improves consistency across users, and preserves the option for user-specific overrides.

# Motivation

- **Cost Efficiency**: Repeated Gemini requests for identical words inflate operational cost and latency.
- **Consistency**: Learners expect canonical imagery for common vocabulary; per-user generation creates divergent experiences.
- **Speed**: Cached responses should return in under 200 ms versus several seconds for fresh generations.
- **Observability**: Centralizing cache data enables better insight into asset provenance and reuse.

# Goals

- **Global Reuse**: Serve cached images across users when the `normalized_word` matches and the asset is within freshness bounds.
- **Configurability**: Expose TTL and overwrite policies via environment variables or configuration records.
- **User Autonomy**: Allow explicit opt-out or override when a learner needs a personalized image.
- **Traceability**: Log and store metadata about cache hits, misses, and regenerations for auditing.

# Non-Goals

- **Sentence/Audio Changes**: This RFC does not alter sentence or audio generation flows.
- **UI Redesign**: Client components continue using the existing API contract; UI refreshes are out of scope.
- **Moderation Revamp**: Content safety processes remain intact; only logging hooks are added.

# Background

The current `supabase/functions/generate-image/index.ts` implementation caches images per user by mapping `word_id` → `flashcards.image_url`. Other users requesting the same word trigger full regeneration. `aiService.generateImage()` in `src/lib/ai-services.ts` expects `{ imageUrl, description, cached }`, which we will keep stable.

# Detailed Design

## Data Model

- **Table**: `global_word_images`
  - `normalized_word` (text, primary key)
  - `image_url` (text)
  - `image_description` (text)
  - `generated_at` (timestamp with time zone)
  - `generated_by_user_id` (uuid)
  - `model_name` (text)
  - `prompt_version` (integer)
  - `version` (integer)
  - `last_used_at` (timestamp with time zone)
  - `hit_count` (integer, default 0)
- **Indexes**: Unique index on `normalized_word`; secondary index on `last_used_at` for reporting.
- **Storage Path**: Global assets stored at `flashcard-images/global/{normalized_word}-{version}.{ext}`.

## Normalization Strategy

- Lowercase and trim whitespace.
- Strip diacritics and punctuation except alphanumerics.
- Collapse consecutive hyphens to single hyphen for storage key compatibility.
- Document the utility function in a shared library module (e.g., `src/lib/text-normalization.ts`).

## Edge Function Flow

1. **Normalize Input**: Produce `normalized_word` from request payload.
2. **Read Global Cache**: Query `global_word_images`.
   - Return cached asset if `generated_at` within `CACHE_TTL_DAYS` and `forceRegenerate` flag is false.
   - Update `last_used_at` and increment `hit_count` asynchronously.
3. **Fallback to User Cache**: If global miss, attempt existing user-specific lookup for backward compatibility.
4. **Generate New Asset**: Invoke Gemini, upload to Supabase storage, gather metadata.
5. **Write Global Cache**: Upsert into `global_word_images` and update `flashcards` for the requesting user.
6. **Handle Overrides**: When `forceRegenerate` is true, generate a new asset but keep the previous record with incremented `version` for audit.
7. **Response**: Return `{ imageUrl, description, cached: boolean, source: 'global' | 'user' | 'generated' }` (adding `source` field while keeping current keys).

## Configuration

- `CACHE_TTL_DAYS` (default: 30)
- `CACHE_ALLOW_OVERWRITE` (true/false)
- `CACHE_MAX_VERSION_HISTORY` (integer, defaults to 5)
- `CACHE_LOG_LEVEL` (info/debug)

## Observability

- **Metrics**: Emit `cache_hit_total`, `cache_miss_total`, `cache_bypass_total`, `gemini_generation_duration_ms`.
- **Logs**: Structured JSON logs with request id, normalized word, cache outcome, latency, and model version.
- **Dashboards**: Grafana or Supabase dashboard summarizing hit rate, miss rate, and API cost savings.
- **Alerts**: Trigger on hit rate below threshold, surge in Gemini errors, or storage upload failures.

# Alternatives Considered

- **Per-Desk Cache**: Rejected. Adds complexity and maintains duplication for common words across desks.
- **Client-Side Caching**: Rejected. Relies on browsers and cannot leverage central metrics or cross-device reuse.
- **CDN-Only Solution**: Rejected. Does not reduce Gemini calls for unique URLs and complicates invalidation.

# Security & Privacy

- **Storage Policies**: Update Supabase bucket rules to allow public read but restrict write access to the edge function service role.
- **PII Handling**: `normalized_word` contains no user identifiers; `generated_by_user_id` stored for auditing but never exposed to clients.
- **Override Abuse**: Rate-limit `forceRegenerate` requests to prevent malicious churn.

# Operational Considerations

- **Backfill Job**: Optional script to populate `global_word_images` with top-used words pre-launch.
- **Versioning**: Maintain history up to `CACHE_MAX_VERSION_HISTORY` for rollback or compliance needs.
- **Rollback Plan**: Feature flag `ENABLE_GLOBAL_IMAGE_CACHE`; disabling reverts flow to per-user behavior.
- **Testing**:
  - Unit tests for normalization, TTL logic, and write-through operations.
  - Integration tests covering hits, misses, overrides, and TTL expiry.
  - Load testing to validate concurrency on the edge function.

# Impact

- **Users**: Faster, consistent imagery with optional personal overrides.
- **Developers**: New table, migrations, and configuration management; minimal client changes.
- **Operations**: Enhanced monitoring responsibilities and alert responses.
- **Finance**: Projected 40% reduction in Gemini image generation spend for repeated words.

# Rollout Plan

- **Stage 1**: Merge behind feature flag, deploy to staging, verify functionality and metrics.
- **Stage 2**: Backfill global cache for high-frequency words; enable flag for internal QA.
- **Stage 3**: Gradual production rollout (10% → 50% → 100%), monitor metrics and logs at each step.
- **Stage 4**: Post-launch review, document learnings, and update playbooks.

# Open Questions

- **Moderation Workflow**: Should flagged images auto-disable globally or fall back to previous version?
- **User Override Exposure**: How should the UI signal whether an image is globally shared versus user-specific?
- **Quota Management**: Do we enforce per-user limits on forced regenerations to avoid exhausting Gemini quota?

# Appendix

- **Related Documents**:
  - `plan/word-image-caching-analysis.md`
  - `plan/global-image-caching-plan.md`
- **Glossary**:
  - `TTL`: Time-to-live for cache validity.
  - `Normalized Word`: Canonical form of word text used as cache key.
  - `Force Regenerate`: Client-controlled flag to bypass cache for a one-off generation.
