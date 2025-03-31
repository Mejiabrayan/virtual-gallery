-- Drop existing storage policies
DROP POLICY IF EXISTS "Anyone can upload to gallery" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete gallery images" ON storage.objects;

-- Create a single permissive policy for all operations
CREATE POLICY "Enable all access to gallery_images bucket" ON storage.objects
FOR ALL TO public
USING (bucket_id = 'gallery_images')
WITH CHECK (bucket_id = 'gallery_images');

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 