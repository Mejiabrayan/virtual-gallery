# Virtual Gallery

A 3D virtual gallery where users can upload and showcase their artwork.

## Database Setup Instructions

To set up the database schema for the Virtual Gallery:

1. Log in to the [Supabase Dashboard](https://app.supabase.com/)
2. Open your project: "virtual gallery"
3. Navigate to the "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the entire contents of the `migration_script.sql` file
6. Click "Run" to execute the script

This will create:
- The `gallery_users` table for user IDs
- The `frame_positions` table for available frames
- The `gallery_images` table for uploaded images
- A storage bucket called `gallery_images`
- Security policies for the data

## Project Structure

- `/app/api/gallery/*` - API endpoints for user creation and image uploads
- `/components/art-gallery.tsx` - 3D gallery viewer component
- `/components/join-gallery.tsx` - User registration component
- `/components/image-upload.tsx` - Image upload component

## Development

```bash
# Install dependencies
bun install

# Run the development server
bun run dev
```

## Technologies Used

- Next.js
- Supabase (Database & Storage)
- Three.js (3D Gallery)
- TypeScript

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
           