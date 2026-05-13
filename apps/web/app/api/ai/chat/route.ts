import { NextResponse } from 'next/server';

import { getAIProvider } from '@buildev/ai';
import type { SceneDocument } from '@buildev/scene-graph';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      prompt?: string;
      document?: SceneDocument;
      selectedIds?: string[];
    };

    if (!body.prompt || !body.document) {
      return NextResponse.json({ error: 'Missing prompt or document' }, { status: 400 });
    }

    const provider = getAIProvider();
    const result = await provider.planEditorActions({
      prompt: body.prompt,
      document: body.document,
      selectedIds: body.selectedIds ?? []
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected AI error' },
      { status: 500 },
    );
  }
}
