import { editorActionSchema, type EditorAction } from '@buildev/editor-core';
import { createLandingPageSeed, getActivePage, type SceneDocument } from '@buildev/scene-graph';

export interface ProviderContext {
  prompt: string;
  document: SceneDocument;
  selectedIds: string[];
}

export interface PlannedActionResponse {
  summary: string;
  actions: EditorAction[];
  mode: 'mock' | 'provider';
}

export interface AIProvider {
  id: string;
  planEditorActions(context: ProviderContext): Promise<PlannedActionResponse>;
}

function extractFrameId(document: SceneDocument): string | null {
  return getActivePage(document).rootIds[0] ?? null;
}

class MockAIProvider implements AIProvider {
  id = 'mock';

  async planEditorActions(context: ProviderContext): Promise<PlannedActionResponse> {
    const prompt = context.prompt.toLowerCase();
    const frameId = extractFrameId(context.document);
    const actions: EditorAction[] = [];
    let summary = 'Applied heuristic canvas updates from mock planner.';

    if (prompt.includes('landing')) {
      const seed = createLandingPageSeed();
      const page = getActivePage(seed);
      const nodes = page.rootIds.flatMap((rootId) => {
        const ordered: Record<string, unknown>[] = [];
        const walk = (id: string): void => {
          const node = seed.nodes[id];
          if (!node) {
            return;
          }
          ordered.push(node as unknown as Record<string, unknown>);
          node.children.forEach(walk);
        };
        walk(rootId);
        return ordered;
      });
      actions.push({
        type: 'replaceSubtree',
        nodeId: extractFrameId(context.document) ?? 'missing',
        nodes
      });
      summary = 'Generated a landing canvas seed optimized for fintech.';
    }

    if (prompt.includes('navbar') && frameId) {
      actions.push({
        type: 'createNode',
        nodeType: 'Navbar',
        name: 'Chat Navbar',
        parentId: frameId,
        node: {
          x: 40,
          y: 32,
          width: 1120,
          height: 72,
          fill: { color: '#FFFFFF' },
          borderRadius: 20,
          provenance: { source: 'ai', prompt: context.prompt }
        }
      });
    }

    if (prompt.includes('pricing') && frameId) {
      const cards = Array.from({ length: 3 }, (_, index) => ({
        type: 'Card',
        name: `Pricing Card ${index + 1}`,
        x: 40 + index * 280,
        y: 520,
        width: 248,
        height: 220,
        borderRadius: 24,
        fill: { color: index === 1 ? '#111111' : '#FFFFFF' },
        textContent: index === 0 ? 'Starter' : index === 1 ? 'Growth' : 'Scale',
        typography: { fontFamily: 'Outfit', fontSize: 20, fontWeight: 600, color: index === 1 ? '#F5F2EC' : '#111111' }
      }));

      actions.push({
        type: 'generateComponent',
        parentId: frameId,
        nodes: cards
      });
      summary = 'Added a pricing section with three cards.';
    }

    if ((prompt.includes('minimalista') || prompt.includes('minimalist')) && frameId) {
      actions.push({
        type: 'setStyles',
        nodeId: frameId,
        patch: {
          fill: { type: 'solid', color: '#F4F1EB' },
          borderRadius: 18
        }
      });
      summary = 'Softened the visual system toward a more minimal direction.';
    }

    if (prompt.includes('oscuros') || prompt.includes('dark')) {
      const targetIds = context.selectedIds.length > 0 ? context.selectedIds : getActivePage(context.document).rootIds;
      targetIds.forEach((nodeId) => {
        actions.push({
          type: 'setStyles',
          nodeId,
          patch: {
            fill: { type: 'solid', color: '#111111' },
            typography: { color: '#F7F3ED' }
          }
        });
      });
      summary = 'Applied a darker palette to the selected area.';
    }

    if (prompt.includes('tabla') || prompt.includes('table')) {
      const selected = context.selectedIds[0];
      if (selected) {
        actions.push({
          type: 'replaceSubtree',
          nodeId: selected,
          nodes: [
            {
              type: 'Table',
              name: 'Comparison Table',
              x: 72,
              y: 520,
              width: 920,
              height: 260,
              borderRadius: 18,
              fill: { color: '#FFFFFF' }
            }
          ]
        });
        summary = 'Replaced the selected subtree with a table scaffold.';
      }
    }

    if (actions.length === 0 && frameId) {
      actions.push({
        type: 'createNode',
        nodeType: 'Text',
        name: 'AI Note',
        parentId: frameId,
        node: {
          x: 72,
          y: 92,
          width: 420,
          height: 48,
          textContent: context.prompt,
          typography: { fontFamily: 'Outfit', fontSize: 18, fontWeight: 500, color: '#222222' },
          provenance: { source: 'ai', prompt: context.prompt }
        }
      });
      summary = 'Added a note because the prompt did not match a richer editor command yet.';
    }

    return {
      summary,
      actions: actions.map((action) => editorActionSchema.parse(action)),
      mode: 'mock'
    };
  }
}

class OpenAICompatibleProvider implements AIProvider {
  id = 'openai-compatible';

  async planEditorActions(context: ProviderContext): Promise<PlannedActionResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
    const model = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';

    if (!apiKey) {
      return new MockAIProvider().planEditorActions(context);
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a UI planning engine. Return JSON with {summary, actions}. Each action must match the editor action contract.'
          },
          {
            role: 'user',
            content: JSON.stringify({
              prompt: context.prompt,
              selectedIds: context.selectedIds,
              activePageId: context.document.activePageId,
              nodes: context.document.nodes
            })
          }
        ]
      })
    });

    if (!response.ok) {
      return new MockAIProvider().planEditorActions(context);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return new MockAIProvider().planEditorActions(context);
    }

    const parsed = JSON.parse(content) as { summary: string; actions: unknown[] };
    return {
      summary: parsed.summary,
      actions: parsed.actions.map((action) => editorActionSchema.parse(action)),
      mode: 'provider'
    };
  }
}

export function getAIProvider(): AIProvider {
  const mode = process.env.BUILDEV_AI_MODE ?? 'mock';
  if (mode === 'provider') {
    return new OpenAICompatibleProvider();
  }
  return new MockAIProvider();
}
