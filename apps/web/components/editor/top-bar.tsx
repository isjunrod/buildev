'use client';

import { Copy, Layers3, MessageSquare, Plus, Redo2, RefreshCw, Square, Type, Undo2 } from 'lucide-react';

import { useEditorStore } from '@/lib/store';

function ToolbarButton({
  label,
  onClick,
  icon
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:border-white/20 hover:bg-white/10"
    >
      {icon}
      {label}
    </button>
  );
}

export function TopBar() {
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const addPrimitive = useEditorStore((state) => state.addPrimitive);
  const toggleCode = useEditorStore((state) => state.toggleCode);
  const toggleChat = useEditorStore((state) => state.toggleChat);
  const exportResult = useEditorStore((state) => state.exportResult);
  const groupSelection = useEditorStore((state) => state.groupSelection);
  const ungroupSelection = useEditorStore((state) => state.ungroupSelection);
  const resetProject = useEditorStore((state) => state.resetProject);

  return (
    <header className="flex items-center justify-between border-b border-white/8 bg-[#0f0f0f]/90 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top_left,_#c2ff66,_#72e1ff)] text-black shadow-[0_10px_30px_rgba(114,225,255,0.18)]">
          <Layers3 size={18} />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-wide">Buildev</div>
          <div className="text-[11px] text-[#9c968b]">AI UI compiler / decompiler</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ToolbarButton label="Undo" onClick={undo} icon={<Undo2 size={14} />} />
        <ToolbarButton label="Redo" onClick={redo} icon={<Redo2 size={14} />} />
        <ToolbarButton label="Text" onClick={() => addPrimitive('Text')} icon={<Type size={14} />} />
        <ToolbarButton label="Card" onClick={() => addPrimitive('Card')} icon={<Square size={14} />} />
        <ToolbarButton label="Group" onClick={groupSelection} icon={<Plus size={14} />} />
        <ToolbarButton label="Ungroup" onClick={ungroupSelection} icon={<RefreshCw size={14} />} />
        <ToolbarButton label="Code" onClick={toggleCode} icon={<Copy size={14} />} />
        <ToolbarButton label="Chat" onClick={toggleChat} icon={<MessageSquare size={14} />} />
        <ToolbarButton label="Reset" onClick={resetProject} icon={<RefreshCw size={14} />} />
        <button
          type="button"
          onClick={async () => {
            const file = exportResult.files[0];
            if (file) {
              await navigator.clipboard.writeText(file.content);
            }
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[#c2ff66] px-4 py-2 text-xs font-semibold text-black transition hover:brightness-95"
        >
          <Copy size={14} />
          Copy Panel Output
        </button>
      </div>
    </header>
  );
}
