import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('✅ Test API route called')
  return NextResponse.json({ 
    message: 'API is working',
    method: 'GET',
    timestamp: new Date().toISOString(),
    url: request.url
  })
}

export async function POST(request: NextRequest) {
  console.log('✅ Test API route called (POST)')
  return NextResponse.json({ 
    message: 'API is working',
    method: 'POST',
    timestamp: new Date().toISOString(),
    url: request.url
  })
}