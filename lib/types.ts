import { Tables } from '@/database.types'

// Frame position type from database
export type FramePosition = Tables<'frame_positions'>

// Gallery image type
export interface GalleryImage {
  id: string
  url: string
  user_id: string    // Note: this is user_id, not userId
  frame_id: string   // Note: this is frame_id, not frameId
  featured: boolean
  created_at: string | null
} 