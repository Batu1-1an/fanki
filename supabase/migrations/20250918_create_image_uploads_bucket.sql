-- Migration for RFC-003: Image-to-Flashcard Batch Creation
-- Note: This migration is kept for consistency but no storage bucket is needed
-- as images are processed in-memory via base64 encoding without persistent storage

-- No database changes required for the image-to-flashcard feature
-- Images are converted to base64 in the frontend and sent directly to the Edge Function
-- This approach avoids storage costs and cleanup requirements

SELECT 1; -- Placeholder query to make migration valid
