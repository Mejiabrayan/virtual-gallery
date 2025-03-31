import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { TablesInsert } from '@/database.types'

export async function POST(req: Request) {
  try {
    console.log("POST /api/gallery/image - Starting image upload");
    
    const supabase = createClient()
    if (!supabase) {
      console.error("Failed to create Supabase client");
      return NextResponse.json(
        { error: 'Failed to connect to database' },
        { status: 500 }
      )
    }
    
    // Parse form data
    const formData = await req.formData()
    
    const userId = formData.get('userId') as string
    const frameId = formData.get('frameId') as string
    const file = formData.get('file') as File
    
    console.log(`Upload request: userId=${userId}, frameId=${frameId}, file=${file?.name || 'not provided'}`);
    
    if (!userId || !frameId || !file) {
      console.error("Missing required fields", { userId, frameId, hasFile: !!file });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Check if user exists
    console.log(`Checking if user ${userId} exists`);
    try {
      const { data: userData, error: userError } = await supabase
        .from('gallery_users')
        .select()
        .eq('user_id', userId)
        .single()
      
      if (userError) {
        console.error("User check error:", userError);
      }
      
      if (!userData) {
        console.log(`User ${userId} not found, creating new user record`);
        // Create user if not exists
        const { error: insertError } = await supabase
          .from('gallery_users')
          .insert([{ user_id: userId }])
        
        if (insertError) {
          console.error("Failed to create user:", insertError);
          return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
          )
        }
      }
    } catch (err) {
      console.error("Error checking user:", err);
    }
    
    // Check if frame is available
    console.log(`Checking if frame ${frameId} is available`);
    try {
      const { data: frameData } = await supabase
        .from('gallery_images')
        .select()
        .eq('frame_id', frameId)
      
      if (frameData && frameData.length > 0) {
        console.error(`Frame ${frameId} is already taken`);
        return NextResponse.json(
          { error: 'Frame position already taken' },
          { status: 400 }
        )
      }
    } catch (err) {
      console.error("Error checking frame:", err);
    }
    
    // Upload image to storage
    console.log(`Uploading file to storage: ${file.name}`);
    
    // Sanitize filename to remove spaces and special characters
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${Date.now()}-${sanitizedName}` // Simplified path without folders
    
    try {
      const { error: storageError } = await supabase
        .storage
        .from('gallery_images')
        .upload(filename, file, {
          upsert: true
        })
      
      if (storageError) {
        console.error("Storage upload error:", storageError);
        return NextResponse.json(
          { error: 'Failed to upload image: ' + storageError.message },
          { status: 500 }
        )
      }
    } catch (err) {
      console.error("Error uploading to storage:", err);
      return NextResponse.json(
        { error: 'Storage upload exception: ' + (err instanceof Error ? err.message : String(err)) },
        { status: 500 }
      )
    }
    
    // Get public URL
    console.log("Getting public URL for uploaded file");
    let publicUrl = "";
    try {
      const { data } = supabase
        .storage
        .from('gallery_images')
        .getPublicUrl(filename)
      
      publicUrl = data.publicUrl;
      console.log(`Public URL: ${publicUrl}`);
    } catch (err) {
      console.error("Error getting public URL:", err);
      return NextResponse.json(
        { error: 'Failed to get public URL' },
        { status: 500 }
      )
    }
    
    // Create gallery image record
    console.log("Creating gallery image record in database");
    const newImage: TablesInsert<'gallery_images'> = {
      user_id: userId,
      frame_id: frameId,
      url: publicUrl,
      featured: frameId === 'center'
    }
    
    // Store image reference in database
    try {
      const { error: dbError } = await supabase
        .from('gallery_images')
        .insert([newImage])
      
      if (dbError) {
        console.error("Database insert error:", dbError);
        return NextResponse.json(
          { error: 'Failed to save image reference: ' + dbError.message },
          { status: 500 }
        )
      }
    } catch (err) {
      console.error("Error inserting into database:", err);
      return NextResponse.json(
        { error: 'Database insert exception: ' + (err instanceof Error ? err.message : String(err)) },
        { status: 500 }
      )
    }
    
    console.log("Image upload successful");
    return NextResponse.json({
      success: true,
      url: publicUrl,
      frameId
    })
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: 'Failed to process image upload: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
} 