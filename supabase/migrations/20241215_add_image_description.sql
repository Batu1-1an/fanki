-- Add image_description column to flashcards table for AI-generated image descriptions
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS image_description TEXT;

-- Add index for better query performance on word lookups
CREATE INDEX IF NOT EXISTS idx_flashcards_word_user_generated 
ON flashcards(user_id, word, generated_at DESC);

-- Update RLS policy to ensure users can only access their own flashcard data
DROP POLICY IF EXISTS "Users can manage their own flashcards" ON flashcards;
CREATE POLICY "Users can manage their own flashcards" ON flashcards
    FOR ALL USING (auth.uid() = user_id);
