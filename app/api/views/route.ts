import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://api.viewsboost.com/views', {
      headers: {
        'Authorization': `Bearer ${process.env.VIEWSBOOST_API_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch views');
    }
    
    const data = await response.json();
    return NextResponse.json({ views: data.views });
  } catch (error) {
    console.error('Error fetching views:', error);
    return NextResponse.json({ error: 'Failed to fetch views' }, { status: 500 });
  }
} 