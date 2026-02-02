import { NextResponse } from 'next/server';

const SKILL_URL = 'https://raw.githubusercontent.com/moltfessionsbot/moltfessions-skill/main/SKILL.md';

export async function GET() {
  try {
    const res = await fetch(SKILL_URL, { 
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    if (!res.ok) {
      return new NextResponse('Failed to fetch skill', { status: 500 });
    }
    
    const content = await res.text();
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    return new NextResponse('Failed to fetch skill', { status: 500 });
  }
}
