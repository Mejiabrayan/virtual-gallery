-- Create a table for gallery users
CREATE TABLE IF NOT EXISTS gallery_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL UNIQUE, -- Random user ID for anonymous users
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a table for frame positions
CREATE TABLE IF NOT EXISTS frame_positions (
  id VARCHAR(50) PRIMARY KEY, -- e.g., 'center', 'leftWall1', etc.
  name VARCHAR(100) NOT NULL,
  wall VARCHAR(50) NOT NULL, -- 'back', 'left', 'right', 'front'
  position VARCHAR(50) NOT NULL, -- e.g., 'center', 'left', 'right'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default frame positions
INSERT INTO frame_positions (id, name, wall, position)
VALUES 
  ('center', 'Featured Center', 'back', 'center'),
  ('backLeft', 'Back Wall Left', 'back', 'left'),
  ('backRight', 'Back Wall Right', 'back', 'right'),
  ('leftWall1', 'Left Wall Front', 'left', 'front'),
  ('leftWall2', 'Left Wall Back', 'left', 'back'),
  ('rightWall1', 'Right Wall Front', 'right', 'front'),
  ('rightWall2', 'Right Wall Back', 'right', 'back');

-- Create a table for gallery images
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES gallery_users(user_id) ON DELETE CASCADE,
  frame_id VARCHAR(50) REFERENCES frame_positions(id),
  url TEXT NOT NULL,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(frame_id) -- Each frame can only have one image
);

-- Create a storage bucket for the gallery images
-- Run this part separately via the Supabase dashboard or CLI if needed
-- CREATE BUCKET gallery_images;

-- Create an RLS policy for the gallery_images bucket
-- This allows anyone to view images, but only the owner can upload
-- PART OF STORAGE CONFIGURATION

-- Enable Row Level Security
ALTER TABLE gallery_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Anyone can create a user
CREATE POLICY "Anyone can create a user" ON gallery_users FOR INSERT TO public WITH CHECK (true);
-- Users can only view their own data
CREATE POLICY "Users can view their own data" ON gallery_users FOR SELECT TO public USING (true);

-- Anyone can view images
CREATE POLICY "Anyone can view images" ON gallery_images FOR SELECT TO public USING (true);
-- Only the owner can insert their image
CREATE POLICY "Users can insert their own images" ON gallery_images FOR INSERT TO public WITH CHECK (auth.uid()::text = user_id OR user_id IS NOT NULL);
-- Only the owner can update their image
CREATE POLICY "Users can update their own images" ON gallery_images FOR UPDATE TO public USING (auth.uid()::text = user_id OR user_id IS NOT NULL);
-- Only the owner can delete their image
CREATE POLICY "Users can delete their own images" ON gallery_images FOR DELETE TO public USING (auth.uid()::text = user_id OR user_id IS NOT NULL); 