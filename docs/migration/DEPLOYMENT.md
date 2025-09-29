# AI Content Generation Deployment Guide

This guide walks you through deploying the AI content generation features for your Fanki flashcard application.

## Prerequisites

1. **Supabase CLI installed**
   ```bash
   npm install -g supabase
   ```

2. **Google Gemini API Key**
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Save it securely for the deployment steps

## Step 1: Initialize Supabase CLI

Link your project to the Supabase CLI:

```bash
supabase init
supabase link --project-ref your-project-id
```

Replace `your-project-id` with your actual Supabase project ID: `razvummhayqnswnabnxk`

## Step 2: Set Environment Variables

Set the Gemini API key as a secret in your Supabase project:

```bash
supabase secrets set GEMINI_API_KEY=your_actual_gemini_api_key_here
```

## Step 3: Deploy Database Migration

Apply the database migration to add image description support:

```bash
supabase db push
```

This will apply the migration in `supabase/migrations/20241215_add_image_description.sql`.

## Step 4: Deploy Edge Functions

Deploy both AI Edge Functions:

```bash
# Deploy sentence generation function
supabase functions deploy generate-sentences

# Deploy image generation function  
supabase functions deploy generate-image
```

## Step 5: Test the Functions

Test that your functions are working:

```bash
# Test sentence generation
supabase functions invoke generate-sentences --data '{
  "word": "beautiful",
  "difficulty": "intermediate", 
  "userId": "test-user-id"
}'

# Test image generation
supabase functions invoke generate-image --data '{
  "word": "beautiful",
  "userId": "test-user-id"
}'
```

## Step 6: Update Environment Variables

Make sure your `.env.local` file has the correct Supabase URL and anon key:

```env
NEXT_PUBLIC_SUPABASE_URL=https://razvummhayqnswnabnxk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 7: Test in Development

Start your development server and test the AI features:

```bash
npm run dev
```

1. Navigate to the word management dashboard
2. Add a new word
3. Check that AI content is being generated in the background
4. Click "Show AI Flashcard" on any word to view generated content

## Troubleshooting

### Common Issues

1. **"Function not found" error**
   - Make sure functions are deployed: `supabase functions list`
   - Check function logs: `supabase functions logs generate-sentences`

2. **"Gemini API error" in logs**
   - Verify API key is set: `supabase secrets list`
   - Check API key has proper permissions
   - Ensure billing is enabled on Google Cloud

3. **CORS errors**
   - The functions include CORS headers, but verify your domain is allowed
   - Check Supabase dashboard > API > CORS settings

4. **Database permission errors**
   - Verify RLS policies are correctly applied
   - Check that the service role key has proper permissions

### Function Logs

View function logs to debug issues:

```bash
# View real-time logs
supabase functions logs generate-sentences --follow

# View logs for image generation
supabase functions logs generate-image --follow
```

## Cost Optimization

The implementation includes several cost optimization features:

1. **Caching**: Sentences are cached for 7 days, images for 30 days
2. **Fallback Content**: If API calls fail, fallback content is provided
3. **Background Generation**: AI content generates after word creation, not blocking the UI

## Next Steps

After successful deployment:

1. Monitor function usage in Supabase dashboard
2. Set up alerts for function errors
3. Consider implementing rate limiting for heavy usage
4. Add content moderation for production use

## Production Deployment

For production deployment:

1. Use a production Supabase project
2. Set up proper monitoring and alerts
3. Configure appropriate rate limits
4. Review and enhance error handling
5. Implement content moderation policies
