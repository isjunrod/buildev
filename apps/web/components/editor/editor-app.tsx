'use client';

import { useEffect } from 'react';

import { CanvasPanel } from '@/components/editor/canvas-panel';
import { ChatPanel } from '@/components/editor/chat-panel';
import { ExportPanel } from '@/components/editor/export-panel';
import { LayersPanel } from '@/components/editor/layers-panel';
import { PropertiesPanel } from '@/components/editor/properties-panel';
import { TopBar } from '@/components/editor/top-bar';
import { useEditorStore } from '@/lib/store';

export function EditorApp() {
  const hydrate = useEditorStore((state) => state.hydrate);
  const hydrated = useEditorStore((state) => state.hydrated);
  const codeOpen = useEditorStore((state) => state.ui.codeOpen);
  const chatOpen = useEditorStore((state) => state.ui.chatOpen);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-white/70">Hydrating Buildev workspace...</div>;
  }

  return (
    <div className="grid h-screen grid-rows-[64px_1fr] bg-[#0d0d0d] text-white">
      <TopBar />
      <div className="grid min-h-0 grid-cols-[260px_1fr_320px] gap-px bg-white/5">
        <LayersPanel />
        <div className="grid min-h-0 grid-rows-[1fr_auto] gap-px bg-white/5">
          <CanvasPanel />
          {codeOpen ? <ExportPanel /> : null}
        </div>
        <div className="grid min-h-0 grid-rows-[1fr_auto] gap-px bg-white/5">
          <PropertiesPanel />
          {chatOpen ? <ChatPanel /> : null}
        </div>
      </div>
    </div>
  );
}
