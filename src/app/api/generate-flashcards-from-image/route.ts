import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for Edge Function calls
)

export async function POST(request: NextRequest) {
  try {
    console.log('API Route: Starting request')
    
    const { imageData, mimeType, userId } = await request.json()
    console.log('API Route: Parsed request body, userId:', userId, 'mimeType:', mimeType)

    if (!imageData || !mimeType || !userId) {
      console.log('API Route: Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: imageData, mimeType, userId' },
        { status: 400 }
      )
    }

    // Get the user's session to verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      console.log('API Route: No auth header')
      return NextResponse.json(
        { error: 'No authentication header' },
        { status: 401 }
      )
    }

    console.log('API Route: Calling Edge Function')
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('generate-flashcards-from-image', {
      body: {
        imageData,
        mimeType,
        userId
      },
      headers: {
        Authorization: authHeader,
      }
    })

    console.log('API Route: Edge Function response', { data, error })

    if (error) {
      console.error('Edge function error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to process image', details: error },
        { status: 500 }
      )
    }

    console.log('API Route: Success, returning data')
    return NextResponse.json(data)

  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
