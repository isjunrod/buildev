import { z } from 'zod';

import { deepClone, snap } from '@buildev/shared';
import { createId } from '@buildev/shared';
import {
  createDocument,
  createNode,
  getActivePage,
  type LayoutStyle,
  type SceneDocument,
  type SceneNode,
  type SceneNodeType
} from '@buildev/scene-graph';

const nodePatchSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  name: z.string().optional(),
  parentId: z.string().nullable().optional(),
  children: z.array(z.string()).optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  rotation: z.number().optional(),
  opacity: z.number().optional(),
  zIndex: z.number().optional(),
  textContent: z.string().optional(),
  semanticRole: z.string().optional()
});

export const editorActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('createNode'),
    nodeType: z.string(),
    name: z.string(),
    parentId: z.string().nullable().optional(),
    node: z.record(z.any()).optional()
  }),
  z.object({
    type: z.literal('updateNode'),
    nodeId: z.string(),
    patch: z.record(z.any())
  }),
  z.object({
    type: z.literal('deleteNode'),
    nodeId: z.string()
  }),
  z.object({
    type: z.literal('groupNodes'),
    nodeIds: z.array(z.string()).min(1),
    groupName: z.string().optional()
  }),
  z.object({
    type: z.literal('ungroupNode'),
    nodeId: z.string()
  }),
  z.object({
    type: z.literal('reorderNodes'),
    parentId: z.string().nullable(),
    orderedIds: z.array(z.string())
  }),
  z.object({
    type: z.literal('setStyles'),
    nodeId: z.string(),
    patch: z.record(z.any())
  }),
  z.object({
    type: z.literal('setLayout'),
    nodeId: z.string(),
    layout: z.record(z.any())
  }),
  z.object({
    type: z.literal('generateComponent'),
    parentId: z.string().nullable().optional(),
    nodes: z.array(z.record(z.any())).min(1)
  }),
  z.object({
    type: z.literal('replaceSubtree'),
    nodeId: z.string(),
    nodes: z.array(z.record(z.any())).min(1)
  })
]);

export type EditorAction = z.infer<typeof editorActionSchema>;

export interface EditorSnapshot {
  document: SceneDocument;
  selectedIds: string[];
}

export interface EditorStoreState extends EditorSnapshot {
  history: SceneDocument[];
  future: SceneDocument[];
}

export function createInitialEditorState(document = createDocument()): EditorStoreState {
  return {
    document,
    selectedIds: [],
    history: [],
    future: []
  };
}

function addNodeToDocument(document: SceneDocument, node: SceneNode): SceneDocument {
  const next = deepClone(document);
  next.nodes[node.id] = node;

  if (node.parentId) {
    const parent = next.nodes[node.parentId];
    if (parent) {
      parent.children = [...parent.children, node.id];
    }
  } else {
    const page = getActivePage(next);
    page.rootIds = [...page.rootIds, node.id];
  }

  return next;
}

function deleteNodeRecursive(document: SceneDocument, nodeId: string): SceneDocument {
  const next = deepClone(document);
  const node = next.nodes[nodeId];
  if (!node) {
    return next;
  }

  node.children.forEach((childId) => {
    deleteNodeRecursive(next, childId);
  });

  if (node.parentId) {
    const parent = next.nodes[node.parentId];
    if (parent) {
      parent.children = parent.children.filter((childId) => childId !== nodeId);
    }
  } else {
    const page = getActivePage(next);
    page.rootIds = page.rootIds.filter((id) => id !== nodeId);
  }

  delete next.nodes[nodeId];
  return next;
}

function normalizeGeneratedNode(input: Record<string, unknown>, parentId: string | null): SceneNode {
  const nodeType = (input.type as SceneNodeType | undefined) ?? 'Rectangle';
  const node = createNode(nodeType, (input.name as string | undefined) ?? nodeType, {
    parentId,
    x: typeof input.x === 'number' ? input.x : 0,
    y: typeof input.y === 'number' ? input.y : 0,
    width: typeof input.width === 'number' ? input.width : 220,
    height: typeof input.height === 'number' ? input.height : 120,
    borderRadius: typeof input.borderRadius === 'number' ? input.borderRadius : 0,
    textContent: typeof input.textContent === 'string' ? input.textContent : undefined,
    semanticRole: typeof input.semanticRole === 'string' ? input.semanticRole : undefined,
    provenance: { source: 'ai' }
  });

  return {
    ...node,
    fill:
      typeof input.fill === 'object' && input.fill && 'color' in (input.fill as Record<string, unknown>)
        ? { type: 'solid', color: String((input.fill as Record<string, unknown>).color) }
        : node.fill,
    typography:
      typeof input.typography === 'object' && input.typography
        ? {
            fontFamily: typeof (input.typography as Record<string, unknown>).fontFamily === 'string'
              ? String((input.typography as Record<string, unknown>).fontFamily)
              : undefined,
            fontSize: typeof (input.typography as Record<string, unknown>).fontSize === 'number'
              ? Number((input.typography as Record<string, unknown>).fontSize)
              : undefined,
            fontWeight: typeof (input.typography as Record<string, unknown>).fontWeight === 'number'
              ? Number((input.typography as Record<string, unknown>).fontWeight)
              : undefined,
            color: typeof (input.typography as Record<string, unknown>).color === 'string'
              ? String((input.typography as Record<string, unknown>).color)
              : undefined
          }
        : node.typography
  };
}

export function applyEditorAction(document: SceneDocument, action: EditorAction): SceneDocument {
  switch (action.type) {
    case 'createNode': {
      const node = createNode(action.nodeType as SceneNodeType, action.name, {
        parentId: action.parentId ?? null,
        ...(action.node ?? {})
      });
      return addNodeToDocument(document, node);
    }
    case 'updateNode': {
      const next = deepClone(document);
      const node = next.nodes[action.nodeId];
      if (!node) {
        return next;
      }
      next.nodes[action.nodeId] = {
        ...node,
        ...action.patch
      };
      return next;
    }
    case 'deleteNode':
      return deleteNodeRecursive(document, action.nodeId);
    case 'groupNodes': {
      const next = deepClone(document);
      const first = next.nodes[action.nodeIds[0]];
      if (!first) {
        return next;
      }
      const group = createNode('Group', action.groupName ?? 'Group', {
        parentId: first.parentId,
        x: first.x,
        y: first.y,
        width: Math.max(...action.nodeIds.map((id) => next.nodes[id]?.x ?? 0)) - first.x + 280,
        height: Math.max(...action.nodeIds.map((id) => next.nodes[id]?.y ?? 0)) - first.y + 180,
        provenance: { source: 'manual' }
      });
      next.nodes[group.id] = group;
      if (group.parentId) {
        const parent = next.nodes[group.parentId];
        if (parent) {
          parent.children = [...parent.children.filter((id) => !action.nodeIds.includes(id)), group.id];
        }
      } else {
        const page = getActivePage(next);
        page.rootIds = [...page.rootIds.filter((id) => !action.nodeIds.includes(id)), group.id];
      }

      group.children = action.nodeIds;
      action.nodeIds.forEach((id) => {
        const child = next.nodes[id];
        if (child) {
          child.parentId = group.id;
        }
      });

      return next;
    }
    case 'ungroupNode': {
      const next = deepClone(document);
      const group = next.nodes[action.nodeId];
      if (!group) {
        return next;
      }
      const parentId = group.parentId;
      group.children.forEach((childId) => {
        const child = next.nodes[childId];
        if (child) {
          child.parentId = parentId;
        }
      });
      if (parentId) {
        const parent = next.nodes[parentId];
        if (parent) {
          parent.children = [
            ...parent.children.filter((id) => id !== group.id),
            ...group.children
          ];
        }
      } else {
        const page = getActivePage(next);
        page.rootIds = [...page.rootIds.filter((id) => id !== group.id), ...group.children];
      }
      delete next.nodes[group.id];
      return next;
    }
    case 'reorderNodes': {
      const next = deepClone(document);
      if (action.parentId) {
        const parent = next.nodes[action.parentId];
        if (parent) {
          parent.children = action.orderedIds;
        }
      } else {
        const page = getActivePage(next);
        page.rootIds = action.orderedIds;
      }
      return next;
    }
    case 'setStyles':
      return applyEditorAction(document, { type: 'updateNode', nodeId: action.nodeId, patch: action.patch });
    case 'setLayout':
      return applyEditorAction(document, { type: 'updateNode', nodeId: action.nodeId, patch: { layout: action.layout as LayoutStyle } });
    case 'generateComponent': {
      let next = deepClone(document);
      action.nodes.forEach((rawNode) => {
        next = addNodeToDocument(next, normalizeGeneratedNode(rawNode, action.parentId ?? null));
      });
      return next;
    }
    case 'replaceSubtree': {
      let next = deleteNodeRecursive(document, action.nodeId);
      action.nodes.forEach((rawNode) => {
        next = addNodeToDocument(next, normalizeGeneratedNode(rawNode, null));
      });
      return next;
    }
  }
}

export function applyValidatedAction(document: SceneDocument, action: unknown): SceneDocument {
  return applyEditorAction(document, editorActionSchema.parse(action));
}

export function commitAction(state: EditorStoreState, action: EditorAction): EditorStoreState {
  return {
    document: applyEditorAction(state.document, action),
    selectedIds: state.selectedIds,
    history: [...state.history, deepClone(state.document)],
    future: []
  };
}

export function undo(state: EditorStoreState): EditorStoreState {
  const previous = state.history.at(-1);
  if (!previous) {
    return state;
  }

  return {
    ...state,
    document: previous,
    history: state.history.slice(0, -1),
    future: [deepClone(state.document), ...state.future]
  };
}

export function redo(state: EditorStoreState): EditorStoreState {
  const nextDocument = state.future[0];
  if (!nextDocument) {
    return state;
  }

  return {
    ...state,
    document: nextDocument,
    history: [...state.history, deepClone(state.document)],
    future: state.future.slice(1)
  };
}

export function moveNode(document: SceneDocument, nodeId: string, x: number, y: number): SceneDocument {
  const node = document.nodes[nodeId];
  if (!node) {
    return document;
  }
  return applyEditorAction(document, {
    type: 'updateNode',
    nodeId,
    patch: { x: snap(x), y: snap(y) }
  });
}

export function resizeNode(document: SceneDocument, nodeId: string, width: number, height: number): SceneDocument {
  return applyEditorAction(document, {
    type: 'updateNode',
    nodeId,
    patch: { width: snap(Math.max(width, 32)), height: snap(Math.max(height, 24)) }
  });
}

export function duplicateNode(document: SceneDocument, nodeId: string): SceneDocument {
  const node = document.nodes[nodeId];
  if (!node) {
    return document;
  }
  const duplicated = {
    ...deepClone(node),
    id: createId(node.type.toLowerCase()),
    name: `${node.name} Copy`,
    x: node.x + 24,
    y: node.y + 24,
    children: []
  };

  return addNodeToDocument(document, duplicated);
}

export function updateText(document: SceneDocument, nodeId: string, textContent: string): SceneDocument {
  return applyEditorAction(document, {
    type: 'updateNode',
    nodeId,
    patch: { textContent }
  });
}

export const editorPatchSchema = nodePatchSchema;
