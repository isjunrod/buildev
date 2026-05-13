import { NextResponse } from 'next/server';

import { reverseEngineerScreenshot } from '@buildev/vision';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { image?: string };

    if (!body.image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const result = await reverseEngineerScreenshot(body.image);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to analyze screenshot'
      },
      { status: 500 },
    );
  }
}
