-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Users can insert their own images" ON gallery_images;
DROP POLICY IF EXISTS "Users can update their own images" ON gallery_images;
DROP POLICY IF EXISTS "Users can delete their own images" ON gallery_images;

-- Create new policies that allow any user with a user_id to manage images
CREATE POLICY "Anyone with user_id can insert images" ON gallery_images 
FOR INSERT TO public 
WITH CHECK (user_id IS NOT NULL);

CREATE POLICY "Anyone with user_id can update images" ON gallery_images 
FOR UPDATE TO public 
USING (user_id IS NOT NULL);

CREATE POLICY "Anyone with user_id can delete images" ON gallery_images 
FOR DELETE TO public 
USING (user_id IS NOT NULL);

-- Fix storage bucket policies
DROP POLICY IF EXISTS "Authenticated Users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Create more permissive storage policies
CREATE POLICY "Anyone can upload to gallery" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'gallery_images');

CREATE POLICY "Anyone can update gallery images" ON storage.objects
FOR UPDATE TO public
USING (bucket_id = 'gallery_images');

CREATE POLICY "Anyone can delete gallery images" ON storage.objects
FOR DELETE TO public
USING (bucket_id = 'gallery_images'); 