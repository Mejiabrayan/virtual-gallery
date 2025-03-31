import { NextResponse } from 'next/server'

export async function GET() {
  // Check if environment variables are loading
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return NextResponse.json({
    supabaseUrl: supabaseUrl ? "✅ URL is set" : "❌ URL is missing",
    supabaseKey: supabaseKey ? "✅ Key is set" : "❌ Key is missing",
    // Only show key prefix for security
    keyPrefix: supabaseKey ? supabaseKey.substring(0, 10) + "..." : "N/A", 
  })
} 