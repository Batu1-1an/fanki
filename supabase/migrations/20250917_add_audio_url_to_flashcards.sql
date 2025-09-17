-- Add audio_url column to flashcards table for TTS pronunciation storage
-- This migration implements RFC-002: Integration of ElevenLabs Text-to-Speech

-- Add audio_url column to store generated pronunciation audio
ALTER TABLE public.flashcards 
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.flashcards.audio_url IS 'URL to the generated pronunciation audio file stored in Supabase Storage';

-- Create storage bucket for flashcard audio files if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'flashcard-audio',
  'flashcard-audio', 
  true, 
  5242880, -- 5MB limit per audio file
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
) ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the audio bucket
CREATE POLICY IF NOT EXISTS "Users can view audio files" ON storage.objects
FOR SELECT USING (bucket_id = 'flashcard-audio');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload audio files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'flashcard-audio' AND auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Users can update their audio files" ON storage.objects
FOR UPDATE USING (bucket_id = 'flashcard-audio' AND auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Users can delete their audio files" ON storage.objects  
FOR DELETE USING (bucket_id = 'flashcard-audio' AND auth.uid() IS NOT NULL);
