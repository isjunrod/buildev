'use client';

import { Copy } from 'lucide-react';

import { useEditorStore } from '@/lib/store';

export function ExportPanel() {
  const exportResult = useEditorStore((state) => state.exportResult);
  const diagnostics = useEditorStore((state) => state.ui.diagnostics);
  const file = exportResult.files[0];

  return (
    <section className="min-h-[220px] border-t border-white/8 bg-[#101010]">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div>
          <div className="text-sm font-semibold">Code / Export Panel</div>
          <div className="text-[11px] text-[#8f897f]">
            {diagnostics ?? 'Phase 1 exposes the panel shell and synced preview surface. Production export is deferred.'}
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            if (file) {
              await navigator.clipboard.writeText(file.content);
            }
          }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs"
        >
          <Copy size={14} />
          Copy
        </button>
      </div>
      <div className="h-[260px] overflow-auto px-4 py-4">
        <pre className="whitespace-pre-wrap rounded-2xl border border-white/8 bg-[#151515] p-4 text-xs leading-6 text-[#d8d2c8]">
          <code>
            {file?.content ??
              `// Phase 1 shell\n// Export pipeline is intentionally not active yet.\n// This panel is reserved for generated code, AST previews and downloads.`}
          </code>
        </pre>
      </div>
    </section>
  );
}
