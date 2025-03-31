import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { TablesInsert } from '@/database.types'

export async function POST() {
  try {
    const supabase = createClient()
    
    // Generate a random user ID (shorter than UUID for user-friendliness)
    const randomId = Math.random().toString(36).substring(2, 10)
    
    // Store the user in the database
    const newUser: TablesInsert<'gallery_users'> = {
      user_id: randomId
    }
    
    const { error } = await supabase
      .from('gallery_users')
      .insert([newUser])
      
    if (error) {
      console.error('Error creating user:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Return the user ID
    return NextResponse.json({ userId: randomId })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
} 