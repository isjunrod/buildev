'use client';

import { Minus, Move, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useEditorStore } from '@/lib/store';
import { clamp } from '@buildev/shared';
import { getActivePage, type SceneNode } from '@buildev/scene-graph';

function NodeView({
  node,
  onDragStart,
  onResizeStart,
  onTextCommit
}: {
  node: SceneNode;
  onDragStart: (event: React.MouseEvent, node: SceneNode) => void;
  onResizeStart: (event: React.MouseEvent, node: SceneNode) => void;
  onTextCommit: (nodeId: string, text: string) => void;
}) {
  const document = useEditorStore((state) => state.editor.document);
  const selectedIds = useEditorStore((state) => state.editor.selectedIds);
  const setSelection = useEditorStore((state) => state.setSelection);
  const [editing, setEditing] = useState(false);

  if (!node.visible) {
    return null;
  }

  const isSelected = selectedIds.includes(node.id);
  const children = node.children.map((childId) => document.nodes[childId]).filter(Boolean) as SceneNode[];

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        setSelection([node.id], event.metaKey || event.ctrlKey);
        onDragStart(event, node);
      }}
      onDoubleClick={() => {
        if (node.type === 'Text' || node.type === 'Button') {
          setEditing(true);
        }
      }}
      className={`group absolute transition-shadow ${isSelected ? 'shadow-[0_0_0_1px_#72e1ff,0_0_0_6px_rgba(114,225,255,0.1)]' : ''}`}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        opacity: node.opacity,
        borderRadius: node.borderRadius,
        background: node.fill?.color ?? (node.type === 'Text' ? 'transparent' : '#ffffff'),
        color: node.typography?.color ?? '#111111'
      }}
    >
      {editing ? (
        <div
          contentEditable
          suppressContentEditableWarning
          className="h-full w-full rounded-[inherit] p-2 outline-none"
          onBlur={(event) => {
            onTextCommit(node.id, event.currentTarget.textContent ?? '');
            setEditing(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onTextCommit(node.id, event.currentTarget.textContent ?? '');
              setEditing(false);
            }
          }}
          style={{
            fontSize: node.typography?.fontSize,
            fontWeight: node.typography?.fontWeight,
            lineHeight: node.typography?.lineHeight
          }}
        >
          {node.textContent ?? node.name}
        </div>
      ) : node.type === 'Text' || node.type === 'Button' || node.textContent ? (
        <div
          className={`flex h-full w-full ${node.type === 'Button' ? 'items-center justify-center' : 'items-start'} p-3`}
          style={{
            fontSize: node.typography?.fontSize,
            fontWeight: node.typography?.fontWeight,
            lineHeight: node.typography?.lineHeight
          }}
        >
          {node.textContent ?? node.name}
        </div>
      ) : null}

      {children.map((child) => (
        <NodeView key={child.id} node={child} onDragStart={onDragStart} onResizeStart={onResizeStart} onTextCommit={onTextCommit} />
      ))}

      {isSelected ? (
        <button
          type="button"
          onMouseDown={(event) => onResizeStart(event, node)}
          className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full border border-[#72e1ff] bg-[#0d0d0d] shadow"
        />
      ) : null}
    </div>
  );
}

export function CanvasPanel() {
  const document = useEditorStore((state) => state.editor.document);
  const page = getActivePage(document);
  const zoom = useEditorStore((state) => state.ui.zoom);
  const panX = useEditorStore((state) => state.ui.panX);
  const panY = useEditorStore((state) => state.ui.panY);
  const setZoom = useEditorStore((state) => state.setZoom);
  const setPan = useEditorStore((state) => state.setPan);
  const updateNode = useEditorStore((state) => state.updateNode);
  const resizeSelected = useEditorStore((state) => state.resizeSelected);
  const updateNodeText = useEditorStore((state) => state.updateText);
  const bringForward = useEditorStore((state) => state.bringForward);
  const sendBackward = useEditorStore((state) => state.sendBackward);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startX: number; startY: number; originW: number; originH: number } | null>(null);
  const roots = useMemo(
    () => page.rootIds.map((id) => document.nodes[id]).filter(Boolean) as SceneNode[],
    [document.nodes, page.rootIds],
  );

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (dragging) {
        const deltaX = (event.clientX - dragging.startX) / zoom;
        const deltaY = (event.clientY - dragging.startY) / zoom;
        updateNode(dragging.id, { x: dragging.originX + deltaX, y: dragging.originY + deltaY });
      }
      if (resizing) {
        const deltaX = (event.clientX - resizing.startX) / zoom;
        const deltaY = (event.clientY - resizing.startY) / zoom;
        resizeSelected(resizing.originW + deltaX, resizing.originH + deltaY);
      }
    };

    const onMouseUp = () => {
      setDragging(null);
      setResizing(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, resizing, resizeSelected, updateNode, zoom]);

  return (
    <section className="relative min-h-0 overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(194,255,102,0.08),transparent_20%),linear-gradient(180deg,#131313,#0b0b0b)]">
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 p-1 backdrop-blur">
        <button type="button" onClick={() => setZoom(clamp(zoom - 0.08, 0.3, 1.8))} className="rounded-full p-2 hover:bg-white/10">
          <Minus size={14} />
        </button>
        <span className="min-w-14 text-center text-xs text-[#b3ada3]">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom(clamp(zoom + 0.08, 0.3, 1.8))} className="rounded-full p-2 hover:bg-white/10">
          <Plus size={14} />
        </button>
        <button type="button" onClick={() => setPan(0, 0)} className="rounded-full p-2 hover:bg-white/10">
          <Move size={14} />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-xs text-[#b3ada3] backdrop-blur">
        <button type="button" onClick={sendBackward} className="rounded-full px-2 py-1 hover:bg-white/10">
          Back
        </button>
        <button type="button" onClick={bringForward} className="rounded-full px-2 py-1 hover:bg-white/10">
          Front
        </button>
      </div>

      <div
        ref={viewportRef}
        role="presentation"
        className="flex h-full items-center justify-center overflow-auto p-10"
        onMouseDown={(event) => {
          if (event.shiftKey) {
            setPan(panX + event.movementX, panY + event.movementY);
          }
        }}
      >
        <div
          className="relative rounded-[40px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.45)]"
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          <div
            className="relative overflow-hidden rounded-[32px] bg-[var(--canvas)]"
            style={{
              width: page.width,
              height: page.height,
              backgroundImage:
                'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
              backgroundSize: '16px 16px'
            }}
          >
            {roots.map((node) => (
              <NodeView
                key={node.id}
                node={node}
                onDragStart={(event, current) => {
                  event.stopPropagation();
                  setDragging({
                    id: current.id,
                    startX: event.clientX,
                    startY: event.clientY,
                    originX: current.x,
                    originY: current.y
                  });
                }}
                onResizeStart={(event, current) => {
                  event.stopPropagation();
                  setResizing({
                    id: current.id,
                    startX: event.clientX,
                    startY: event.clientY,
                    originW: current.width,
                    originH: current.height
                  });
                }}
                onTextCommit={updateNodeText}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
