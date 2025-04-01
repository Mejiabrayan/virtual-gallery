import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { TablesInsert } from '@/database.types'
import { revalidatePath } from "next/cache"

export async function POST() {
  try {
    const supabase = createClient()
    
    // Generate a random user ID (shorter than UUID for user-friendliness)
    const randomId = Math.random().toString(36).substring(2, 10)
    
    // Store the user in the database
    const newUser: TablesInsert<'gallery_users'> = {
      user_id: randomId
    }
    
    const { data: user, error } = await supabase
      .from('gallery_users')
      .insert([newUser])
      .select()
      .single()
      
    if (error) throw error
    
    // Revalidate the gallery page to show the new user
    revalidatePath('/gallery')
    
    // Return the user_id as userId for frontend consistency
    return NextResponse.json({ userId: user.user_id })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
} 