import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { GROK_SYSTEM_PROMPT, GROK_API_URL, GROK_MODEL } from '@/lib/grok';

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Grok API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROK_MODEL,
        messages: [
          { role: 'system', content: GROK_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Grok API error:', errText);
      return NextResponse.json(
        { error: 'Grok API request failed' },
        { status: response.status }
      );
    }

    // Stream the response through to the client
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
