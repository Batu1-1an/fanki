-- Fix word deletion to properly handle cascading deletes
-- This prevents orphaned records in reviews and flashcards tables

CREATE OR REPLACE FUNCTION delete_word_and_dependents(word_id_to_delete uuid)
RETURNS void AS $$
BEGIN
  -- Delete reviews associated with the word
  DELETE FROM public.reviews WHERE word_id = word_id_to_delete;
  
  -- Delete flashcards associated with the word
  DELETE FROM public.flashcards WHERE word_id = word_id_to_delete;
  
  -- Finally, delete the word itself
  DELETE FROM public.words WHERE id = word_id_to_delete;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_word_and_dependents(uuid) TO authenticated;
