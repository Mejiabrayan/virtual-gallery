-- Create a storage bucket for gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery_images', 'Gallery Images', true);

-- Set up storage policies
-- Allow public access to view all images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'gallery_images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Users can upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'gallery_images'
);

-- Allow users to update and delete their own images
CREATE POLICY "Users can update their own images" ON storage.objects
FOR UPDATE TO authenticated USING (
  bucket_id = 'gallery_images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'gallery_images'
  AND (storage.foldername(name))[1] = auth.uid()::text
); 