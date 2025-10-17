# GitHub Actions Secrets Setup

This document explains how to configure secrets for the CI/CD pipeline.

## Required Secrets

### 1. NEXT_PUBLIC_SUPABASE_URL
**Required for**: Build job  
**Description**: Your Supabase project URL  
**Example**: `https://your-project.supabase.co`

**How to get it**:
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the "Project URL"

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
**Required for**: Build job  
**Description**: Your Supabase anonymous (public) key  
**Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**How to get it**:
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the "anon public" key

### 3. CODECOV_TOKEN (Optional)
**Required for**: Coverage upload  
**Description**: Codecov upload token for coverage reports  
**Note**: Optional for public repositories

**How to get it**:
1. Go to https://codecov.io
2. Sign in with GitHub
3. Add your repository
4. Copy the upload token

---

## How to Add Secrets

### For Repository Owners

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: Your Supabase URL
   - Click **Add secret**
5. Repeat for other secrets

### For Fork Contributors

**You don't need to set these secrets!** The workflow is configured to:
- Use placeholder values for builds on forks
- Skip Codecov upload on pull requests
- Still run all tests and checks

---

## CI/CD Workflow Behavior

### With Secrets Configured ✅
- ✅ Full test suite runs
- ✅ Application builds with real Supabase config
- ✅ Coverage reports upload to Codecov
- ✅ Security audits complete
- ✅ Build size analysis

### Without Secrets (Fork PRs) ✅
- ✅ Full test suite runs
- ✅ Application builds with placeholder config
- ⏭️ Coverage upload skipped (not needed for PRs)
- ✅ Security audits complete
- ✅ Build size analysis

---

## Environment Variables vs Secrets

### Public Variables (Safe to expose)
- `NEXT_PUBLIC_SUPABASE_URL` - Public API endpoint
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anonymous key

**Note**: These are "public" because they're exposed in the browser. However, Supabase Row Level Security (RLS) protects your data.

### Private Secrets (Never expose)
- `SUPABASE_SERVICE_ROLE_KEY` - Never commit or expose
- `CODECOV_TOKEN` - Only for uploads

---

## Troubleshooting

### Build Fails with "Supabase URL not found"

**Solution**: The workflow uses placeholder values, so this shouldn't happen. If it does:
1. Check that the environment variables are being passed in the workflow
2. Verify the Next.js build can run without real Supabase config

### Codecov Upload Fails

**Solution**: This is expected and safe. The workflow is configured with:
```yaml
fail_ci_if_error: false
```

The upload only runs on push events from the repository owner.

### Fork PR Build Fails

**Solution**: 
1. Check that placeholder values are being used
2. Ensure the application can build without real Supabase credentials
3. Tests should still pass with mocked data

---

## Security Best Practices

### ✅ DO:
- Store secrets in GitHub Actions secrets
- Use Row Level Security in Supabase
- Rotate keys periodically
- Use different keys for staging/production

### ❌ DON'T:
- Commit secrets to the repository
- Share service role keys
- Use production keys in CI/CD
- Expose secrets in logs

---

## Testing Locally

To test the build with the same configuration as CI:

```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="your-url"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-key"

# Run build
npm run build

# Run tests with coverage
npm run test:coverage
```

---

## Quick Setup Checklist

- [ ] Create Supabase project
- [ ] Copy Supabase URL and anon key
- [ ] Add NEXT_PUBLIC_SUPABASE_URL to GitHub secrets
- [ ] Add NEXT_PUBLIC_SUPABASE_ANON_KEY to GitHub secrets
- [ ] (Optional) Add CODECOV_TOKEN for coverage reports
- [ ] Push to main/develop branch
- [ ] Verify CI/CD passes

---

## Support

If you encounter issues:
1. Check the Actions tab for detailed error logs
2. Verify secrets are correctly named (case-sensitive)
3. Ensure Supabase project is active
4. Review this document

For more information:
- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
