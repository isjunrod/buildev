import { assertNever } from '@buildev/shared';
import { getActivePage, type SceneDocument, type SceneNode } from '@buildev/scene-graph';

export interface ExportFile {
  path: string;
  content: string;
}

export interface ExportResult {
  files: ExportFile[];
  entry: string;
}

function hexToTailwindClass(prefix: string, color?: string): string[] {
  return color ? [`${prefix}-[${color}]`] : [];
}

function typographyClasses(node: SceneNode): string[] {
  if (!node.typography) {
    return [];
  }

  const classes: string[] = [];
  if (node.typography.fontSize) {
    classes.push(`text-[${node.typography.fontSize}px]`);
  }
  if (node.typography.fontWeight) {
    classes.push(`font-[${node.typography.fontWeight}]`);
  }
  if (node.typography.color) {
    classes.push(`text-[${node.typography.color}]`);
  }
  if (node.typography.textAlign) {
    classes.push(`text-${node.typography.textAlign}`);
  }
  return classes;
}

function layoutClasses(node: SceneNode): string[] {
  if (node.layout?.mode !== 'flex') {
    return [];
  }
  return [
    'flex',
    node.layout.direction === 'row' ? 'flex-row' : 'flex-col',
    node.layout.justify === 'space-between'
      ? 'justify-between'
      : node.layout.justify === 'center'
        ? 'justify-center'
        : 'justify-start',
    node.layout.align === 'center' ? 'items-center' : node.layout.align === 'stretch' ? 'items-stretch' : 'items-start',
    node.layout.wrap ? 'flex-wrap' : ''
  ].filter(Boolean);
}

function sharedNodeClasses(node: SceneNode): string[] {
  return [
    'absolute',
    ...hexToTailwindClass('bg', node.fill?.color),
    ...typographyClasses(node),
    ...layoutClasses(node),
    node.borderRadius ? `rounded-[${node.borderRadius}px]` : ''
  ].filter(Boolean);
}

function styleProp(node: SceneNode): string {
  const pieces = [
    `left: ${node.x}px`,
    `top: ${node.y}px`,
    `width: ${node.width}px`,
    `height: ${node.height}px`,
    `opacity: ${node.opacity}`
  ];
  return `{ ${pieces.join(', ')} }`;
}

function nodeSignature(node: SceneNode, document: SceneDocument): string {
  const childTypes = node.children.map((childId) => document.nodes[childId]?.type ?? 'Unknown').join('|');
  return `${node.type}:${childTypes}:${node.width}:${node.height}`;
}

function renderNode(node: SceneNode, document: SceneDocument, extractedComponents: Map<string, string>): string {
  const children = node.children
    .map((childId) => document.nodes[childId])
    .filter((child): child is SceneNode => Boolean(child));

  const extractedName = extractedComponents.get(node.id);
  if (extractedName) {
    return `<${extractedName} className="${sharedNodeClasses(node).join(' ')}" style=${styleProp(node)} />`;
  }

  switch (node.type) {
    case 'Text':
      return `<div className="${sharedNodeClasses(node).join(' ')}" style=${styleProp(node)}>${node.textContent ?? node.name}</div>`;
    case 'Button':
      return `<button className="${['absolute', 'inline-flex items-center justify-center', ...sharedNodeClasses(node)].join(' ')}" style=${styleProp(node)}>${node.textContent ?? node.name}</button>`;
    case 'Image':
      return `<img alt="${node.name}" src="${node.imageSrc ?? '/logo.svg'}" className="${sharedNodeClasses(node).join(' ')} object-cover" style=${styleProp(node)} />`;
    case 'Card':
    case 'Container':
    case 'Frame':
    case 'Group':
    case 'Grid':
    case 'Navbar':
    case 'Sidebar':
    case 'Table':
    case 'List':
    case 'Modal':
      return `<div className="${sharedNodeClasses(node).join(' ')}" style=${styleProp(node)}>${children.map((child) => renderNode(child, document, extractedComponents)).join('')}</div>`;
    case 'Badge':
      return `<span className="${sharedNodeClasses(node).join(' ')}" style=${styleProp(node)}>${node.textContent ?? node.name}</span>`;
    case 'Input':
    case 'Textarea':
    case 'Checkbox':
    case 'Radio':
    case 'Switch':
    case 'Select':
    case 'Tabs':
    case 'Rectangle':
    case 'Ellipse':
    case 'Line':
    case 'Icon':
    case 'Chart':
      return `<div className="${sharedNodeClasses(node).join(' ')}" style=${styleProp(node)}>${node.textContent ?? ''}</div>`;
    case 'Page':
      return children.map((child) => renderNode(child, document, extractedComponents)).join('');
    default:
      return assertNever(node.type);
  }
}

function buildExtractedComponents(document: SceneDocument): { extracted: Map<string, string>; definitions: string[] } {
  const page = getActivePage(document);
  const extracted = new Map<string, string>();
  const definitions: string[] = [];

  page.rootIds.forEach((rootId) => {
    const root = document.nodes[rootId];
    if (!root) {
      return;
    }

    const siblingGroups = new Map<string, SceneNode[]>();
    root.children.forEach((childId) => {
      const child = document.nodes[childId];
      if (!child) {
        return;
      }
      const signature = nodeSignature(child, document);
      siblingGroups.set(signature, [...(siblingGroups.get(signature) ?? []), child]);
    });

    siblingGroups.forEach((nodes) => {
      if (nodes.length < 2) {
        return;
      }
      const componentName = nodes[0]?.exportMeta?.componentName ?? `${nodes[0]?.name.replace(/\s+/g, '') ?? 'Extracted'}Item`;
      nodes.forEach((node) => extracted.set(node.id, componentName));
      const first = nodes[0];
      if (!first) {
        return;
      }
      const childMarkup = first.children
        .map((childId) => document.nodes[childId])
        .filter((child): child is SceneNode => Boolean(child))
        .map((child) => renderNode(child, document, extracted))
        .join('');
      definitions.push(
        `function ${componentName}(props: React.HTMLAttributes<HTMLDivElement>) {\n  return <div {...props}>${childMarkup}</div>;\n}`,
      );
    });
  });

  return { extracted, definitions };
}

export function exportReactTailwind(document: SceneDocument): ExportResult {
  const page = getActivePage(document);
  const { extracted, definitions } = buildExtractedComponents(document);
  const pageMarkup = page.rootIds
    .map((rootId) => document.nodes[rootId])
    .filter((node): node is SceneNode => Boolean(node))
    .map((node) => renderNode(node, document, extracted))
    .join('');

  const appFile = `import React from 'react';

${definitions.join('\n\n')}

export default function GeneratedPage() {
  return (
    <main className="min-h-screen bg-[#EDE8E0] p-8">
      <div className="relative mx-auto h-[${page.height}px] w-[${page.width}px] overflow-hidden rounded-[32px] border border-black/5 bg-white">
        ${pageMarkup}
      </div>
    </main>
  );
}
`;

  return {
    entry: 'GeneratedPage.tsx',
    files: [
      {
        path: 'GeneratedPage.tsx',
        content: appFile
      }
    ]
  };
}
