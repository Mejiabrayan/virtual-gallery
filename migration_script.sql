-- Gallery Database Schema
-- Copy and paste this entire script into the Supabase SQL Editor and run it

-- Create a table for gallery users
CREATE TABLE IF NOT EXISTS public.gallery_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL UNIQUE, -- Random user ID for anonymous users
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a table for frame positions
CREATE TABLE IF NOT EXISTS public.frame_positions (
  id VARCHAR(50) PRIMARY KEY, -- e.g., 'center', 'leftWall1', etc.
  name VARCHAR(100) NOT NULL,
  wall VARCHAR(50) NOT NULL, -- 'back', 'left', 'right', 'front'
  position VARCHAR(50) NOT NULL, -- e.g., 'center', 'left', 'right'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default frame positions
INSERT INTO public.frame_positions (id, name, wall, position)
VALUES 
  ('center', 'Featured Center', 'back', 'center'),
  ('backLeft', 'Back Wall Left', 'back', 'left'),
  ('backRight', 'Back Wall Right', 'back', 'right'),
  ('leftWall1', 'Left Wall Front', 'left', 'front'),
  ('leftWall2', 'Left Wall Back', 'left', 'back'),
  ('rightWall1', 'Right Wall Front', 'right', 'front'),
  ('rightWall2', 'Right Wall Back', 'right', 'back')
ON CONFLICT (id) DO NOTHING;

-- Create a table for gallery images
CREATE TABLE IF NOT EXISTS public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES public.gallery_users(user_id) ON DELETE CASCADE,
  frame_id VARCHAR(50) REFERENCES public.frame_positions(id),
  url TEXT NOT NULL,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(frame_id) -- Each frame can only have one image
);

-- Create a storage bucket for gallery images if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('gallery_images', 'Gallery Images', true)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Failed to create bucket, it may already exist';
END
$$;

-- Enable Row Level Security
ALTER TABLE public.gallery_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Anyone can create a user
DROP POLICY IF EXISTS "Anyone can create a user" ON public.gallery_users;
CREATE POLICY "Anyone can create a user" ON public.gallery_users FOR INSERT TO public WITH CHECK (true);

-- Anyone can view users
DROP POLICY IF EXISTS "Anyone can view users" ON public.gallery_users;
CREATE POLICY "Anyone can view users" ON public.gallery_users FOR SELECT TO public USING (true);

-- Anyone can view images
DROP POLICY IF EXISTS "Anyone can view images" ON public.gallery_images;
CREATE POLICY "Anyone can view images" ON public.gallery_images FOR SELECT TO public USING (true);

-- Any user can insert an image with their own user_id
DROP POLICY IF EXISTS "Users can insert their own images" ON public.gallery_images;
CREATE POLICY "Users can insert their own images" ON public.gallery_images 
  FOR INSERT TO public 
  WITH CHECK (true);  -- We'll validate the user ID in the API

-- Any user can update or delete images with their own user_id
DROP POLICY IF EXISTS "Users can update their own images" ON public.gallery_images;
CREATE POLICY "Users can update their own images" ON public.gallery_images 
  FOR UPDATE TO public 
  USING (true);  -- We'll validate the user ID in the API

DROP POLICY IF EXISTS "Users can delete their own images" ON public.gallery_images;
CREATE POLICY "Users can delete their own images" ON public.gallery_images 
  FOR DELETE TO public 
  USING (true);  -- We'll validate the user ID in the API

-- Storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'gallery_images');

DROP POLICY IF EXISTS "Anyone can upload" ON storage.objects;
CREATE POLICY "Anyone can upload" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'gallery_images');

DROP POLICY IF EXISTS "Anyone can update their own images" ON storage.objects;
CREATE POLICY "Anyone can update their own images" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'gallery_images');

DROP POLICY IF EXISTS "Anyone can delete their own images" ON storage.objects;
CREATE POLICY "Anyone can delete their own images" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'gallery_images');

-- Display success message
DO $$
BEGIN
  RAISE NOTICE 'Gallery database schema created successfully!';
END
$$; 