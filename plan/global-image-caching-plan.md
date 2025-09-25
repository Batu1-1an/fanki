# Global Word Image Cache Implementation Plan

## Overview

- **Goal**: Enable shared AI-generated imagery for identical vocabulary words across all users while preserving per-user customization controls.
- **Current State**: `supabase/functions/generate-image/index.ts` returns cached assets only when a requesting user already owns the word; assets are stored in `flashcards` rows keyed by user-specific `word_id` values.
- **Proposed Change**: Introduce a global cache keyed by normalized word text, implement read-through/write-through logic in the edge function, and instrument observability to measure cache effectiveness.

## Objectives

- **Reduce Duplicate API Calls**: Minimize redundant Gemini requests by serving a shared asset when a word already has a recent image.
- **Maintain User Autonomy**: Allow users to override the global asset with their own image when desired.
- **Improve Operational Insight**: Track cache hit rate, regeneration frequency, and asset provenance for auditing and tuning.
- **Support Configurable Policy**: Make cache freshness windows adjustable without redeploying code.

## Scope

- **In Scope**
  - Schema updates and storage structure for normalized word cache.
  - `generate-image` edge function enhancements for global reuse.
  - Migration scripts, backfill strategy, and observability instrumentation.
  - Documentation updates and operational runbooks.
- **Out of Scope**
  - Changes to sentence/audio generation flows.
  - Client UI modifications beyond wiring into the updated API response.
  - Content moderation policy updates beyond ensuring compliance logging.

## Deliverables

| Deliverable | Description | Owner |
| --- | --- | --- |
| Schema Migration | SQL migration creating `global_word_images` table and indexes | Backend Engineer |
| Edge Function Update | Refactor `supabase/functions/generate-image/index.ts` for read/write global cache | Backend Engineer |
| Storage Policy | Supabase storage rules ensuring public access to shared assets | Infra Engineer |
| Observability Pack | Metrics, logs, alerts, and dashboards for cache monitoring | Platform Engineer |
| Documentation | Updates to `plan/word-image-caching-analysis.md` and runbooks | Tech Writer |

## Workstreams & Tasks

### 1. Data Layer

- **Design Normalization Strategy**: Define `normalized_word` transformation (lowercase, trim, diacritics removal) and document in `plan/word-image-caching-analysis.md`.
- **Create Schema Migration**: Add `supabase/migrations/*_create_global_word_images.sql` defining columns `normalized_word`, `image_url`, `image_description`, `generated_at`, `generated_by_user_id`, `model_name`, `prompt_version`, `version`, `last_used_at`.
- **Implement Indexing**: Add unique index on `normalized_word` and supporting indexes on `last_used_at` for reporting queries.
- **Backfill Job (Optional)**: Script to populate global cache from top N `flashcards` entries for go-live readiness.

### 2. Edge Function (`supabase/functions/generate-image/index.ts`)

- **Add Config Loading**: Read `CACHE_TTL_DAYS` and `CACHE_ALLOW_OVERWRITE` from environment variables.
- **Implement Read-Through**: Query `global_word_images` before user-specific lookup; return cached asset when `generated_at` within TTL.
- **Implement Write-Through**: After generating a new asset, upsert into both `global_word_images` and user-specific `flashcards` tables; update `last_used_at` on cache hits.
- **Handle Overrides**: Respect optional `forceRegenerate` flag from clients to bypass global cache when a user wants a unique image.
- **Enhance Logging**: Emit structured logs containing request context, cache outcome (`hit`, `miss`, `bypass`), and latency.

### 3. Storage & Access Control

- **Standardize Paths**: Store global assets under `flashcard-images/global/{normalized_word}-{version}.{ext}` while keeping user-specific files under existing paths.
- **Review Bucket Policies**: Ensure public read access is available while guarding against unauthorized writes (Supabase storage policy updates).
- **Set Cache Headers**: Configure CDN cache-control headers in storage upload to balance freshness and CDN efficiency.

### 4. Observability & Monitoring

- **Metrics Instrumentation**: Emit metrics (e.g., `cache_hit_count`, `cache_miss_count`, `regeneration_count`, `gemini_latency_ms`).
- **Logging Improvements**: Standardize log schema for easier querying in Supabase logs or external observability tools.
- **Alerting Rules**: Create alerts for high miss rates, Gemini error spikes, and storage upload failures.
- **Dashboard**: Build a Supabase (or external) dashboard summarizing hit rate, API cost savings, and latency trends.

### 5. Documentation & Enablement

- **Developer Guide**: Document cache behavior, config knobs, and override mechanics in `plan/word-image-caching-analysis.md`.
- **Runbook**: Provide incident response steps for cache corruption, Gemini outages, or forced invalidations.
- **Release Notes**: Communicate change impacts to product/support teams.

## Timeline (Indicative)

| Week | Milestones |
| --- | --- |
| Week 1 | Finalize design, normalization strategy, and migration plan. |
| Week 2 | Implement schema migration, storage policy, and edge function read-through logic. |
| Week 3 | Complete write-through logic, configurability, and observability instrumentation. |
| Week 4 | Backfill global cache, execute QA (unit tests, integration tests, load tests). |
| Week 5 | Deploy to staging, run smoke tests, finalize documentation, and promote to production. |

## Risks & Mitigations

- **Risk**: Cache serves inappropriate content across users.
  - **Mitigation**: Maintain moderation pipeline and allow users to flag or override images.
- **Risk**: Stale assets persist due to misconfigured TTL.
  - **Mitigation**: Expose TTL via env variable, create alert for `last_used_at` > threshold.
- **Risk**: Migration impacts performance.
  - **Mitigation**: Use rolling migration with locks minimized, test backfill job on staging datasets.
- **Risk**: Gemini API quota reductions lower cache fill rate.
  - **Mitigation**: Monitor regeneration counts and adjust fallback strategies (e.g., use Unsplash fallback or previously cached images).

## Success Metrics

- **Cache Hit Rate**: Target >70% hit rate on repeated word image requests after launch.
- **API Cost Reduction**: 40% decrease in Gemini image generation calls for repeat words.
- **Latency Improvement**: Median response time for cached images under 200 ms.
- **Override Adoption**: Track number of user overrides to ensure autonomy features are used appropriately.

## Ownership & Communication

| Role | Responsibilities | Point of Contact |
| --- | --- | --- |
| Backend Lead | Schema design, edge function implementation | TBD |
| Platform Engineer | Observability, deployment automation | TBD |
| QA Engineer | Test plan creation, automation coverage | TBD |
| Product Manager | Rollout coordination, stakeholder updates | TBD |
| Support Lead | Prepare support scripts and FAQ updates | TBD |

## Next Steps

- **Design Review**: Schedule architectural review with backend and infra leads to validate schema and access policies.
- **Create Tickets**: Break down workstreams into individual tasks in the project tracker (e.g., Jira, Linear) with timelines.
- **Kickoff Meeting**: Align stakeholders on timeline, responsibilities, and success measures before development begins.
