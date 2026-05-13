'use client';

import { RefreshCw, Send } from 'lucide-react';
import { useState } from 'react';

import { useEditorStore } from '@/lib/store';

export function ChatPanel() {
  const [prompt, setPrompt] = useState('');
  const messages = useEditorStore((state) => state.messages);
  const addMessage = useEditorStore((state) => state.addMessage);
  const clearMessages = useEditorStore((state) => state.clearMessages);

  const submit = () => {
    if (!prompt.trim()) {
      return;
    }

    const currentPrompt = prompt;
    setPrompt('');
    addMessage({ id: `user-${Date.now()}`, role: 'user', content: currentPrompt });
    addMessage({
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: 'Phase 1 leaves the chat shell ready, but action planning is intentionally deferred to the next phase.',
      meta: 'chat wiring only'
    });
  };

  return (
    <section className="flex min-h-[280px] flex-col bg-[#111111]">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div>
          <div className="text-sm font-semibold">Chat Actions</div>
          <div className="text-[11px] text-[#8f897f]">Prompt to validated editor actions</div>
        </div>
        <button type="button" onClick={clearMessages} className="rounded-full p-2 text-[#8f897f] hover:bg-white/5">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-auto px-4 py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-2xl border px-3 py-3 text-sm ${
              message.role === 'user'
                ? 'ml-8 border-[#72e1ff]/20 bg-[#72e1ff]/10 text-white'
                : message.role === 'assistant'
                  ? 'mr-6 border-[#c2ff66]/20 bg-[#c2ff66]/10 text-white'
                  : 'border-white/8 bg-white/5 text-[#d4cfc7]'
            }`}
          >
            <div>{message.content}</div>
            {message.meta ? <div className="mt-2 text-[11px] text-[#8f897f]">{message.meta}</div> : null}
          </div>
        ))}
      </div>

      <div className="border-t border-white/8 p-4">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Describe what you want to build. Action planning comes in the next phase."
          className="min-h-28 w-full rounded-2xl border border-white/10 bg-[#171717] px-4 py-3 text-sm text-white outline-none placeholder:text-[#6f6a62]"
        />
        <div className="mt-3 flex items-center justify-between">
          <div className="text-[11px] text-[#8f897f]">Chat shell is live. Structured editor actions are not enabled in Phase 1.</div>
          <button
            type="button"
            onClick={submit}
            className="inline-flex items-center gap-2 rounded-full bg-[#c2ff66] px-4 py-2 text-xs font-semibold text-black"
          >
            <Send size={14} />
            Queue
          </button>
        </div>
      </div>
    </section>
  );
}
