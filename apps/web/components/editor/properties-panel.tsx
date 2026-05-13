'use client';

import { Lock, MoveUpRight, PaintBucket, Trash2 } from 'lucide-react';

import { useEditorStore } from '@/lib/store';

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-xs text-[#8f897f]">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function PropertiesPanel() {
  const document = useEditorStore((state) => state.editor.document);
  const selectedId = useEditorStore((state) => state.editor.selectedIds[0]);
  const updateNode = useEditorStore((state) => state.updateNode);
  const deleteSelected = useEditorStore((state) => state.deleteSelected);
  const duplicateSelected = useEditorStore((state) => state.duplicateSelected);
  const selectedNode = selectedId ? document.nodes[selectedId] : null;

  return (
    <aside className="flex min-h-0 flex-col bg-[#111111]">
      <div className="border-b border-white/8 px-4 py-3">
        <div className="text-sm font-semibold">Inspector</div>
        <div className="text-[11px] text-[#8f897f]">Properties, semantics and export hints</div>
      </div>

      {selectedNode ? (
        <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
          <div className="mb-4 rounded-2xl border border-white/8 bg-white/5 p-4">
            <div className="mb-1 text-xs uppercase tracking-[0.18em] text-[#8f897f]">{selectedNode.type}</div>
            <div className="text-lg font-semibold">{selectedNode.name}</div>
            <div className="mt-2 text-xs text-[#8f897f]">Source: {selectedNode.provenance.source}</div>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="X">
                <input
                  value={Math.round(selectedNode.x)}
                  onChange={(event) => updateNode(selectedNode.id, { x: Number(event.target.value) })}
                  className="rounded-xl border border-white/8 bg-[#181818] px-3 py-2 text-sm text-white outline-none"
                />
              </Field>
              <Field label="Y">
                <input
                  value={Math.round(selectedNode.y)}
                  onChange={(event) => updateNode(selectedNode.id, { y: Number(event.target.value) })}
                  className="rounded-xl border border-white/8 bg-[#181818] px-3 py-2 text-sm text-white outline-none"
                />
              </Field>
              <Field label="Width">
                <input
                  value={Math.round(selectedNode.width)}
                  onChange={(event) => updateNode(selectedNode.id, { width: Number(event.target.value) })}
                  className="rounded-xl border border-white/8 bg-[#181818] px-3 py-2 text-sm text-white outline-none"
                />
              </Field>
              <Field label="Height">
                <input
                  value={Math.round(selectedNode.height)}
                  onChange={(event) => updateNode(selectedNode.id, { height: Number(event.target.value) })}
                  className="rounded-xl border border-white/8 bg-[#181818] px-3 py-2 text-sm text-white outline-none"
                />
              </Field>
            </div>

            <Field label="Name">
              <input
                value={selectedNode.name}
                onChange={(event) => updateNode(selectedNode.id, { name: event.target.value })}
                className="rounded-xl border border-white/8 bg-[#181818] px-3 py-2 text-sm text-white outline-none"
              />
            </Field>

            <Field label="Fill">
              <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-[#181818] px-3 py-2">
                <PaintBucket size={14} className="text-[#8f897f]" />
                <input
                  type="color"
                  value={selectedNode.fill?.color ?? '#ffffff'}
                  onChange={(event) => updateNode(selectedNode.id, { fill: { type: 'solid', color: event.target.value } })}
                  className="h-8 w-12 rounded border-0 bg-transparent p-0"
                />
                <span className="text-sm text-white">{selectedNode.fill?.color ?? '#ffffff'}</span>
              </div>
            </Field>

            {(selectedNode.type === 'Text' || selectedNode.type === 'Button') && (
              <Field label="Content">
                <textarea
                  value={selectedNode.textContent ?? ''}
                  onChange={(event) => updateNode(selectedNode.id, { textContent: event.target.value })}
                  className="min-h-24 rounded-xl border border-white/8 bg-[#181818] px-3 py-2 text-sm text-white outline-none"
                />
              </Field>
            )}

            <Field label="Semantic Role">
              <input
                value={selectedNode.semanticRole ?? ''}
                onChange={(event) => updateNode(selectedNode.id, { semanticRole: event.target.value })}
                className="rounded-xl border border-white/8 bg-[#181818] px-3 py-2 text-sm text-white outline-none"
              />
            </Field>

            <Field label="Opacity">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedNode.opacity}
                onChange={(event) => updateNode(selectedNode.id, { opacity: Number(event.target.value) })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={duplicateSelected}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-medium"
              >
                <MoveUpRight size={14} />
                Duplicate
              </button>
              <button
                type="button"
                onClick={deleteSelected}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-3 text-sm font-medium text-red-200"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-[#8f897f]">
          <div>
            <Lock className="mx-auto mb-3 text-[#58524b]" />
            Select a layer to inspect position, styles and semantic metadata.
          </div>
        </div>
      )}
    </aside>
  );
}
