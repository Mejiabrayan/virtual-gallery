import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { Tables } from '@/database.types'

// Default frame positions if none found in database
const DEFAULT_FRAME_POSITIONS = [
  { id: "center", name: "Featured Center", wall: "back", position: "center", created_at: null },
  { id: "backLeft", name: "Back Wall Left", wall: "back", position: "left", created_at: null },
  { id: "backRight", name: "Back Wall Right", wall: "back", position: "right", created_at: null },
  { id: "leftWall1", name: "Left Wall Front", wall: "left", position: "front", created_at: null },
  { id: "leftWall2", name: "Left Wall Back", wall: "left", position: "back", created_at: null },
  { id: "rightWall1", name: "Right Wall Front", wall: "right", position: "front", created_at: null },
  { id: "rightWall2", name: "Right Wall Back", wall: "right", position: "back", created_at: null }
]

export async function GET() {
  try {
    const supabase = createClient()
    
    // Get frame positions
    const { data: framePositions, error: framesError } = await supabase
      .from('frame_positions')
      .select('*')
    
    if (framesError) {
      console.error('Error fetching frame positions:', framesError)
    }
    
    // Get images
    const { data: images, error: imagesError } = await supabase
      .from('gallery_images')
      .select('*')
    
    if (imagesError) {
      console.error('Error fetching images:', imagesError)
    }
    
    // Transform the data to match our front-end expectations
    const transformedImages: {
      url: string
      featured: boolean
      userId: string
      frameId: string
    }[] = (images || []).map((image: Tables<'gallery_images'>) => ({
      url: image.url,
      featured: image.featured || false,
      userId: image.user_id,
      frameId: image.frame_id || ''
    }))
    
    return NextResponse.json({
      images: transformedImages || [],
      framePositions: framePositions && framePositions.length > 0 ? framePositions : DEFAULT_FRAME_POSITIONS
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({
      images: [],
      framePositions: DEFAULT_FRAME_POSITIONS
    })
  }
} 