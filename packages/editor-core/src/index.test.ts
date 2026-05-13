import { describe, expect, it } from 'vitest';

import { commitAction, undo } from '@buildev/editor-core';
import { createLandingPageSeed, getActivePage } from '@buildev/scene-graph';

describe('editor-core', () => {
  it('creates and undoes a node mutation', () => {
    const initial = {
      document: createLandingPageSeed(),
      selectedIds: [],
      history: [],
      future: []
    };

    const frameId = getActivePage(initial.document).rootIds[0];
    expect(frameId).toBeTruthy();

    const next = commitAction(initial, {
      type: 'createNode',
      nodeType: 'Text',
      name: 'Test Node',
      parentId: frameId ?? null,
      node: { x: 10, y: 20, textContent: 'hello' }
    });

    expect(Object.values(next.document.nodes).some((node) => node.name === 'Test Node')).toBe(true);

    const reverted = undo(next);
    expect(Object.values(reverted.document.nodes).some((node) => node.name === 'Test Node')).toBe(false);
  });
});
