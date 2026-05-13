'use client';

import { ChevronDown, Eye, EyeOff, Layers3, PanelLeftClose } from 'lucide-react';

import { useEditorStore } from '@/lib/store';
import { getActivePage, type SceneNode } from '@buildev/scene-graph';

function LayerRow({ node, depth }: { node: SceneNode; depth: number }) {
  const document = useEditorStore((state) => state.editor.document);
  const selectedIds = useEditorStore((state) => state.editor.selectedIds);
  const setSelection = useEditorStore((state) => state.setSelection);
  const updateNode = useEditorStore((state) => state.updateNode);

  return (
    <div>
      <button
        type="button"
        onClick={(event) => setSelection([node.id], event.metaKey || event.ctrlKey)}
        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
          selectedIds.includes(node.id) ? 'bg-[#c2ff66]/15 text-[#f6f2ea]' : 'text-[#d2cdc4] hover:bg-white/5'
        }`}
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
      >
        <span className="flex items-center gap-2">
          <ChevronDown size={14} className="text-[#7f796f]" />
          <span>{node.name}</span>
        </span>
        <span
          onClick={(event) => {
            event.stopPropagation();
            updateNode(node.id, { visible: !node.visible });
          }}
          className="text-[#7f796f]"
        >
          {node.visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </span>
      </button>
      {node.children.map((childId) => {
        const child = document.nodes[childId];
        return child ? <LayerRow key={child.id} node={child} depth={depth + 1} /> : null;
      })}
    </div>
  );
}

export function LayersPanel() {
  const document = useEditorStore((state) => state.editor.document);
  const page = getActivePage(document);
  const roots = page.rootIds.map((id) => document.nodes[id]).filter(Boolean) as SceneNode[];

  return (
    <aside className="flex min-h-0 flex-col bg-[#111111]">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div>
          <div className="text-sm font-semibold">Layers</div>
          <div className="text-[11px] text-[#8f897f]">Scene graph and pages</div>
        </div>
        <PanelLeftClose size={16} className="text-[#8f897f]" />
      </div>
      <div className="border-b border-white/8 px-4 py-3">
        <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#8f897f]">
            <Layers3 size={12} />
            Active Page
          </div>
          <div className="text-sm font-medium">{page.name}</div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-2 py-3">
        {roots.map((node) => (
          <LayerRow key={node.id} node={node} depth={0} />
        ))}
      </div>
    </aside>
  );
}
