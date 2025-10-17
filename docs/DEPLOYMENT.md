# Fanki Deployment Guide

This guide covers deploying Fanki to production environments.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Vercel Deployment](#vercel-deployment-recommended)
- [Supabase Setup](#supabase-setup)
- [Environment Variables](#environment-variables)
- [Edge Functions](#edge-functions)
- [Database Migrations](#database-migrations)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- [ ] Supabase project created
- [ ] GitHub repository set up
- [ ] Vercel account (or alternative platform)
- [ ] API keys for external services:
  - Google Gemini API (for sentence generation)
  - ElevenLabs API (for audio generation)
  - Unsplash API (for images)

## Vercel Deployment (Recommended)

### Step 1: Prepare Repository

```bash
# Ensure all changes are committed
git add .
git commit -m "chore: prepare for deployment"
git push origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your Fanki repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### Step 3: Configure Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

### Step 4: Deploy

Click **"Deploy"** and wait for build to complete.

## Supabase Setup

### Step 1: Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Choose organization and region
4. Set strong database password
5. Wait for project provisioning

### Step 2: Get Credentials

Navigate to **Settings → API** and copy:

- Project URL (NEXT_PUBLIC_SUPABASE_URL)
- Anon/Public Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
- Service Role Key (keep secret, for edge functions)

### Step 3: Configure Authentication

1. Go to **Authentication → Providers**
2. Enable Email provider
3. Configure OAuth providers (optional):
   - Google
   - GitHub
   - Discord

4. Set **Site URL**: `https://your-app.vercel.app`
5. Add **Redirect URLs**:
   ```
   https://your-app.vercel.app/auth/callback
   http://localhost:3000/auth/callback (for development)
   ```

## Edge Functions

### Install Supabase CLI

```bash
npm install -g supabase
```

### Link Project

```bash
supabase link --project-ref your-project-ref
```

### Set Secrets

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_key
supabase secrets set ELEVENLABS_API_KEY=your_elevenlabs_key
supabase secrets set UNSPLASH_ACCESS_KEY=your_unsplash_key
```

### Deploy Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy generate-sentences
supabase functions deploy generate-image
supabase functions deploy generate-audio
supabase functions deploy generate-memory-hook
supabase functions deploy generate-flashcards-from-image
```

### Verify Deployment

```bash
supabase functions list
```

## Database Migrations

### Apply Migrations

#### Option 1: Using Supabase Dashboard

1. Go to **SQL Editor**
2. Open migration files from `supabase/migrations/`
3. Execute each migration in order

#### Option 2: Using Supabase CLI

```bash
# Link project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push

# Or apply specific migration
supabase db push --file supabase/migrations/20250930041114_add_default_note_type.sql
```

### Verify Migrations

```bash
# Check migration status
supabase migration list

# View database schema
supabase db diff
```

### Seed Data (Optional)

If you have seed data:

```bash
supabase db reset --db-url your-db-url
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key | `eyJ...` |
| `NEXT_PUBLIC_APP_URL` | Your app URL | `https://fanki.app` |
| `NEXT_PUBLIC_SITE_URL` | Same as APP_URL | `https://fanki.app` |

### Optional Variables

| Variable | Description | When Needed |
|----------|-------------|-------------|
| `NODE_ENV` | Environment | Auto-set by Vercel |
| `ANALYZE` | Bundle analysis | Set to `true` for analysis |

### Setting in Different Environments

#### Vercel
Settings → Environment Variables → Add

#### Netlify
Site Settings → Build & deploy → Environment → Add

#### Railway
Variables tab → New Variable

## Post-Deployment

### 1. Test Critical Flows

- [ ] User registration
- [ ] User login
- [ ] Create a word/card
- [ ] Study session
- [ ] Review submission
- [ ] AI content generation

### 2. Verify Database

```sql
-- Check table counts
SELECT 
  (SELECT COUNT(*) FROM profiles) as profiles,
  (SELECT COUNT(*) FROM words) as words,
  (SELECT COUNT(*) FROM notes) as notes,
  (SELECT COUNT(*) FROM cards) as cards,
  (SELECT COUNT(*) FROM reviews) as reviews;
```

### 3. Test Edge Functions

```bash
# Test from command line
curl -X POST \
  'https://your-project.supabase.co/functions/v1/generate-sentences' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"word": "test", "difficulty": "intermediate", "userId": "test-id"}'
```

### 4. Check Logs

- **Vercel**: Dashboard → Project → Deployments → View Function Logs
- **Supabase**: Dashboard → Logs → Edge Functions

## Monitoring

### Set Up Error Tracking

#### Option 1: Sentry

```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

#### Option 2: LogRocket

```bash
npm install logrocket
```

### Monitor Performance

- **Vercel Analytics**: Enable in project settings
- **Google Analytics**: Add tracking code
- **Lighthouse CI**: Set up in CI/CD

### Database Monitoring

1. Go to Supabase → Reports
2. Monitor:
   - API requests
   - Database CPU/Memory
   - Storage usage
   - Function invocations

## Troubleshooting

### Build Failures

**Error**: `Module not found`
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error**: `Type errors`
```bash
npm run type-check
```

### Runtime Errors

**Error**: `Supabase connection failed`
- Verify environment variables
- Check Supabase project status
- Ensure API keys are correct

**Error**: `Edge function timeout`
- Check function logs in Supabase
- Verify API keys are set
- Increase function timeout if needed

### Database Issues

**Error**: `Permission denied`
- Check RLS policies
- Verify user authentication
- Review table permissions

**Error**: `Migration failed`
- Apply migrations in correct order
- Check for conflicting changes
- Review migration SQL for errors

### Performance Issues

**Slow page loads**
- Enable Next.js caching
- Optimize images
- Review database queries
- Check edge function performance

**High memory usage**
- Review component re-renders
- Check for memory leaks
- Optimize large data fetches

## Rollback Procedure

If deployment fails:

### Vercel

1. Go to Deployments
2. Find last working deployment
3. Click **"..."** → **"Promote to Production"**

### Database

```bash
# Rollback last migration
supabase db reset --version previous
```

### Edge Functions

```bash
# Redeploy previous version
git checkout previous-commit
supabase functions deploy
```

## Security Checklist

- [ ] Environment variables are secret
- [ ] RLS policies are enabled
- [ ] HTTPS is enforced
- [ ] CORS is configured correctly
- [ ] Rate limiting is enabled (if applicable)
- [ ] Security headers are set
- [ ] Sensitive data is not logged
- [ ] API keys have minimal permissions

## Performance Optimization

### Next.js Configuration

```javascript
// next.config.mjs
export default {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['supabase.co', 'images.unsplash.com'],
  },
  // Enable compression
  compress: true,
}
```

### Database Indexes

Ensure these indexes exist:

```sql
CREATE INDEX IF NOT EXISTS idx_cards_due_date ON cards(due_date);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(note_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_word ON reviews(user_id, word_id);
```

## Backup Strategy

### Database Backups

Supabase provides automatic daily backups (paid plan).

For manual backups:

```bash
# Export database
pg_dump -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  > backup.sql
```

### Storage Backups

Set up automated backups for Supabase Storage buckets.

## Scaling Considerations

### When to Scale

- API response time > 2s consistently
- Database CPU > 80%
- Error rate > 1%
- Storage > 80% capacity

### Scaling Options

1. **Upgrade Supabase Plan**
   - More database resources
   - Higher connection limits
   - Better performance

2. **Optimize Queries**
   - Add indexes
   - Use database functions
   - Implement caching

3. **CDN for Static Assets**
   - Use Vercel Edge Network
   - Or configure Cloudflare

## Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Vercel Documentation](https://vercel.com/docs)

## Support

If you encounter issues:

1. Check [GitHub Issues](https://github.com/your-repo/issues)
2. Review [Documentation](../README.md)
3. Contact support team

---

**Last Updated**: 2025-01-17  
**Version**: 1.0.0
