'use client';

import { create } from 'zustand';

import {
  applyValidatedAction,
  commitAction,
  createInitialEditorState,
  duplicateNode,
  redo,
  resizeNode,
  undo,
  updateText
} from '@buildev/editor-core';
import { exportReactTailwind, type ExportResult } from '@buildev/exporters';
import {
  createLandingPageSeed,
  createNode,
  getActivePage,
  type SceneDocument,
  type SceneNode
} from '@buildev/scene-graph';

const STORAGE_KEY = 'buildev-editor-state-v1';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  meta?: string;
}

interface UIState {
  zoom: number;
  panX: number;
  panY: number;
  codeOpen: boolean;
  chatOpen: boolean;
  diagnostics?: string;
}

interface EditorStore {
  hydrated: boolean;
  editor: ReturnType<typeof createInitialEditorState>;
  ui: UIState;
  messages: ChatMessage[];
  exportResult: ExportResult;
  hydrate: () => void;
  persist: () => void;
  setSelection: (nodeIds: string[], additive?: boolean) => void;
  applyAction: (action: unknown) => void;
  updateNode: (nodeId: string, patch: Partial<SceneNode>) => void;
  moveSelected: (dx: number, dy: number) => void;
  resizeSelected: (width: number, height: number) => void;
  updateText: (nodeId: string, text: string) => void;
  addPrimitive: (type: SceneNode['type']) => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  undo: () => void;
  redo: () => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleCode: () => void;
  toggleChat: () => void;
  groupSelection: () => void;
  ungroupSelection: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  importScreenshotNodes: (frame: SceneNode, nodes: SceneNode[], diagnostics: string) => void;
  refreshExport: () => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  resetProject: () => void;
}

function createSeedState() {
  const document = createLandingPageSeed();
  return createInitialEditorState(document);
}

function serializeEditor(editor: ReturnType<typeof createInitialEditorState>): string {
  return JSON.stringify(editor.document);
}

function parseEditorState(serialized: string | null): ReturnType<typeof createInitialEditorState> {
  if (!serialized) {
    return createSeedState();
  }

  try {
    const document = JSON.parse(serialized) as SceneDocument;
    return createInitialEditorState(document);
  } catch {
    return createSeedState();
  }
}

function selectedNode(document: SceneDocument, selectedIds: string[]): SceneNode | null {
  const selectedId = selectedIds[0];
  return selectedId ? document.nodes[selectedId] ?? null : null;
}

function reorderWithinParent(document: SceneDocument, nodeId: string, direction: 'forward' | 'backward'): SceneDocument {
  const node = document.nodes[nodeId];
  if (!node) {
    return document;
  }

  const container = node.parentId ? document.nodes[node.parentId]?.children : getActivePage(document).rootIds;
  if (!container) {
    return document;
  }

  const currentIndex = container.indexOf(nodeId);
  const targetIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= container.length) {
    return document;
  }

  const orderedIds = [...container];
  const [removed] = orderedIds.splice(currentIndex, 1);
  if (!removed) {
    return document;
  }
  orderedIds.splice(targetIndex, 0, removed);

  return applyValidatedAction(document, {
    type: 'reorderNodes',
    parentId: node.parentId,
    orderedIds
  });
}

export const useEditorStore = create<EditorStore>((set, get) => {
  const editor = createSeedState();
  return {
    hydrated: false,
    editor,
    ui: {
      zoom: 0.72,
      panX: 0,
      panY: 0,
      codeOpen: true,
      chatOpen: true
    },
    messages: [
      {
        id: 'welcome',
        role: 'system',
        content: 'Buildev is ready. Chat commands become validated canvas actions.',
        meta: 'mock by default'
      }
    ],
    exportResult: exportReactTailwind(editor.document),
    hydrate: () => {
      if (typeof window === 'undefined') {
        return;
      }
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const nextEditor = parseEditorState(saved);
      set({
        hydrated: true,
        editor: nextEditor,
        exportResult: exportReactTailwind(nextEditor.document)
      });
    },
    persist: () => {
      if (typeof window === 'undefined') {
        return;
      }
      window.localStorage.setItem(STORAGE_KEY, serializeEditor(get().editor));
    },
    setSelection: (nodeIds, additive = false) => {
      set((state) => ({
        editor: {
          ...state.editor,
          selectedIds: additive
            ? Array.from(new Set([...state.editor.selectedIds, ...nodeIds]))
            : nodeIds
        }
      }));
    },
    applyAction: (action) => {
      set((state) => {
        const next = commitAction(state.editor, action as never);
        return { editor: next, exportResult: exportReactTailwind(next.document) };
      });
      get().persist();
    },
    updateNode: (nodeId, patch) => {
      get().applyAction({ type: 'updateNode', nodeId, patch });
    },
    moveSelected: (dx, dy) => {
      const { editor } = get();
      const node = selectedNode(editor.document, editor.selectedIds);
      if (!node) {
        return;
      }
      get().updateNode(node.id, { x: node.x + dx, y: node.y + dy });
    },
    resizeSelected: (width, height) => {
      set((state) => {
        const selectedId = state.editor.selectedIds[0];
        if (!selectedId) {
          return state;
        }
        const document = resizeNode(state.editor.document, selectedId, width, height);
        const next = {
          ...state.editor,
          document,
          history: [...state.editor.history, state.editor.document],
          future: []
        };
        return { editor: next, exportResult: exportReactTailwind(document) };
      });
      get().persist();
    },
    updateText: (nodeId, text) => {
      set((state) => {
        const document = updateText(state.editor.document, nodeId, text);
        const next = {
          ...state.editor,
          document,
          history: [...state.editor.history, state.editor.document],
          future: []
        };
        return { editor: next, exportResult: exportReactTailwind(document) };
      });
      get().persist();
    },
    addPrimitive: (type) => {
      const frameId = getActivePage(get().editor.document).rootIds[0] ?? null;
      const label = type === 'Text' ? 'New Text' : `New ${type}`;
      const primitive =
        type === 'Text'
          ? createNode('Text', label, {
              parentId: frameId,
              x: 72,
              y: 72,
              width: 240,
              height: 40,
              textContent: 'Edit me',
              typography: { fontFamily: 'Outfit', fontSize: 18, fontWeight: 500, color: '#1B1B1B' }
            })
          : createNode(type, label, {
              parentId: frameId,
              x: 72,
              y: 72,
              width: 220,
              height: 120,
              borderRadius: 20,
              fill: { type: 'solid', color: '#FFFFFF' }
            });
      get().applyAction({
        type: 'generateComponent',
        parentId: frameId,
        nodes: [primitive as unknown as Record<string, unknown>]
      });
      get().setSelection([primitive.id]);
    },
    duplicateSelected: () => {
      set((state) => {
        const selectedId = state.editor.selectedIds[0];
        if (!selectedId) {
          return state;
        }
        const document = duplicateNode(state.editor.document, selectedId);
        const next = {
          ...state.editor,
          document,
          history: [...state.editor.history, state.editor.document],
          future: []
        };
        return { editor: next, exportResult: exportReactTailwind(document) };
      });
      get().persist();
    },
    deleteSelected: () => {
      const selectedId = get().editor.selectedIds[0];
      if (!selectedId) {
        return;
      }
      get().applyAction({ type: 'deleteNode', nodeId: selectedId });
      get().setSelection([]);
    },
    undo: () => {
      set((state) => {
        const next = undo(state.editor);
        return { editor: next, exportResult: exportReactTailwind(next.document) };
      });
      get().persist();
    },
    redo: () => {
      set((state) => {
        const next = redo(state.editor);
        return { editor: next, exportResult: exportReactTailwind(next.document) };
      });
      get().persist();
    },
    setZoom: (zoom) => set((state) => ({ ui: { ...state.ui, zoom } })),
    setPan: (x, y) => set((state) => ({ ui: { ...state.ui, panX: x, panY: y } })),
    toggleCode: () => set((state) => ({ ui: { ...state.ui, codeOpen: !state.ui.codeOpen } })),
    toggleChat: () => set((state) => ({ ui: { ...state.ui, chatOpen: !state.ui.chatOpen } })),
    groupSelection: () => {
      const selectedIds = get().editor.selectedIds;
      if (selectedIds.length < 2) {
        return;
      }
      get().applyAction({ type: 'groupNodes', nodeIds: selectedIds, groupName: 'Grouped Layer' });
    },
    ungroupSelection: () => {
      const selectedId = get().editor.selectedIds[0];
      if (!selectedId) {
        return;
      }
      get().applyAction({ type: 'ungroupNode', nodeId: selectedId });
    },
    bringForward: () => {
      set((state) => {
        const selectedId = state.editor.selectedIds[0];
        if (!selectedId) {
          return state;
        }
        const document = reorderWithinParent(state.editor.document, selectedId, 'forward');
        return {
          editor: {
            ...state.editor,
            document,
            history: [...state.editor.history, state.editor.document],
            future: []
          },
          exportResult: exportReactTailwind(document)
        };
      });
      get().persist();
    },
    sendBackward: () => {
      set((state) => {
        const selectedId = state.editor.selectedIds[0];
        if (!selectedId) {
          return state;
        }
        const document = reorderWithinParent(state.editor.document, selectedId, 'backward');
        return {
          editor: {
            ...state.editor,
            document,
            history: [...state.editor.history, state.editor.document],
            future: []
          },
          exportResult: exportReactTailwind(document)
        };
      });
      get().persist();
    },
    importScreenshotNodes: (frame, nodes, diagnostics) => {
      set((state) => {
        let document = state.editor.document;
        const existingFrame = getActivePage(document).rootIds[0];
        if (existingFrame) {
          document = applyValidatedAction(document, {
            type: 'deleteNode',
            nodeId: existingFrame
          });
        }
        document = applyValidatedAction(document, {
          type: 'generateComponent',
          parentId: null,
          nodes: [frame as unknown as Record<string, unknown>, ...nodes]
        });

        const next = {
          ...state.editor,
          document,
          history: [...state.editor.history, state.editor.document],
          future: []
        };

        return {
          editor: next,
          exportResult: exportReactTailwind(document),
          ui: { ...state.ui, diagnostics }
        };
      });
      get().persist();
    },
    refreshExport: () => set((state) => ({ exportResult: exportReactTailwind(state.editor.document) })),
    addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
    clearMessages: () => set({ messages: [] }),
    resetProject: () => {
      const next = createSeedState();
      set({
        editor: next,
        exportResult: exportReactTailwind(next.document),
        messages: [
          {
            id: 'welcome-reset',
            role: 'system',
            content: 'Canvas reset to the default fintech seed.'
          }
        ]
      });
      get().persist();
    }
  };
});
