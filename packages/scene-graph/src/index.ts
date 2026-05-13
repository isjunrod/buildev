import { z } from 'zod';

import { createId } from '@buildev/shared';

export const nodeTypeSchema = z.enum([
  'Page',
  'Frame',
  'Group',
  'Rectangle',
  'Ellipse',
  'Line',
  'Text',
  'Image',
  'Icon',
  'Button',
  'Input',
  'Textarea',
  'Checkbox',
  'Radio',
  'Switch',
  'Select',
  'Tabs',
  'Badge',
  'Card',
  'Modal',
  'Navbar',
  'Sidebar',
  'List',
  'Grid',
  'Table',
  'Chart',
  'Container'
]);

export type SceneNodeType = z.infer<typeof nodeTypeSchema>;
export type ProvenanceSource = 'manual' | 'ai' | 'screenshot' | 'template';

export interface ColorFill {
  type: 'solid';
  color: string;
}

export interface StrokeStyle {
  color: string;
  width: number;
}

export interface ShadowStyle {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}

export interface TypographyStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
}

export interface SpacingStyle {
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  gap?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

export interface LayoutStyle {
  mode: 'absolute' | 'flex';
  direction?: 'row' | 'column';
  justify?: 'start' | 'center' | 'end' | 'space-between';
  align?: 'start' | 'center' | 'end' | 'stretch';
  wrap?: boolean;
}

export interface ConstraintsStyle {
  horizontal?: 'left' | 'center' | 'right' | 'stretch';
  vertical?: 'top' | 'center' | 'bottom' | 'stretch';
}

export interface ExportMetadata {
  componentName?: string;
  preferredTag?: string;
  lockedToComponent?: boolean;
}

export interface SourceProvenance {
  source: ProvenanceSource;
  prompt?: string;
  screenshotName?: string;
  confidence?: number;
  notes?: string[];
}

export interface SceneNode {
  id: string;
  type: SceneNodeType;
  name: string;
  parentId: string | null;
  children: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  fill?: ColorFill;
  stroke?: StrokeStyle;
  borderRadius?: number;
  shadows?: ShadowStyle[];
  typography?: TypographyStyle;
  spacing?: SpacingStyle;
  layout?: LayoutStyle;
  constraints?: ConstraintsStyle;
  visible: boolean;
  locked: boolean;
  semanticRole?: string;
  variantProps?: Record<string, string | number | boolean>;
  exportMeta?: ExportMetadata;
  provenance: SourceProvenance;
  textContent?: string;
  imageSrc?: string;
}

export interface ScenePage {
  id: string;
  name: string;
  rootIds: string[];
  width: number;
  height: number;
}

export interface SceneDocument {
  id: string;
  name: string;
  pages: Record<string, ScenePage>;
  pageOrder: string[];
  nodes: Record<string, SceneNode>;
  activePageId: string;
}

export interface NodeInput extends Partial<Omit<SceneNode, 'id' | 'children' | 'parentId' | 'provenance'>> {
  id?: string;
  children?: string[];
  parentId?: string | null;
  provenance?: SourceProvenance;
}

export function createNode(type: SceneNodeType, name: string, input: NodeInput = {}): SceneNode {
  return {
    id: input.id ?? createId(type.toLowerCase()),
    type,
    name,
    parentId: input.parentId ?? null,
    children: input.children ?? [],
    x: input.x ?? 0,
    y: input.y ?? 0,
    width: input.width ?? 240,
    height: input.height ?? 120,
    rotation: input.rotation ?? 0,
    opacity: input.opacity ?? 1,
    zIndex: input.zIndex ?? 0,
    fill: input.fill,
    stroke: input.stroke,
    borderRadius: input.borderRadius ?? 0,
    shadows: input.shadows,
    typography: input.typography,
    spacing: input.spacing,
    layout: input.layout ?? { mode: 'absolute' },
    constraints: input.constraints,
    visible: input.visible ?? true,
    locked: input.locked ?? false,
    semanticRole: input.semanticRole,
    variantProps: input.variantProps,
    exportMeta: input.exportMeta,
    provenance: input.provenance ?? { source: 'manual' },
    textContent: input.textContent,
    imageSrc: input.imageSrc
  };
}

export function createDocument(name = 'Buildev Project'): SceneDocument {
  const pageId = createId('page');
  return {
    id: createId('doc'),
    name,
    pages: {
      [pageId]: {
        id: pageId,
        name: 'Page 1',
        rootIds: [],
        width: 1440,
        height: 1200
      }
    },
    pageOrder: [pageId],
    nodes: {},
    activePageId: pageId
  };
}

export function getActivePage(document: SceneDocument): ScenePage {
  const page = document.pages[document.activePageId];
  if (!page) {
    throw new Error('Active page not found');
  }
  return page;
}

export function getPageNodes(document: SceneDocument, pageId = document.activePageId): SceneNode[] {
  const page = document.pages[pageId];
  if (!page) {
    return [];
  }

  const ordered: SceneNode[] = [];

  const walk = (id: string): void => {
    const node = document.nodes[id];
    if (!node) {
      return;
    }
    ordered.push(node);
    node.children.forEach(walk);
  };

  page.rootIds.forEach(walk);
  return ordered;
}

export function createLandingPageSeed(): SceneDocument {
  const document = createDocument('Fintech Landing');
  const page = getActivePage(document);

  const frame = createNode('Frame', 'Landing Frame', {
    x: 48,
    y: 48,
    width: 1200,
    height: 980,
    fill: { type: 'solid', color: '#F7F5F2' },
    borderRadius: 28,
    semanticRole: 'page-shell',
    provenance: { source: 'template', notes: ['base-seed'] }
  });

  const navbar = createNode('Navbar', 'Navbar', {
    parentId: frame.id,
    x: 32,
    y: 28,
    width: 1136,
    height: 72,
    fill: { type: 'solid', color: '#FFFFFF' },
    borderRadius: 22,
    layout: { mode: 'flex', direction: 'row', justify: 'space-between', align: 'center' },
    spacing: { paddingLeft: 24, paddingRight: 24 },
    semanticRole: 'navigation',
    provenance: { source: 'template' }
  });

  const brand = createNode('Text', 'Brand', {
    parentId: navbar.id,
    x: 24,
    y: 22,
    width: 180,
    height: 28,
    textContent: 'Buildev Pay',
    typography: { fontFamily: 'Outfit', fontSize: 24, fontWeight: 700, color: '#101010' },
    provenance: { source: 'template' }
  });

  const hero = createNode('Container', 'Hero', {
    parentId: frame.id,
    x: 32,
    y: 132,
    width: 1136,
    height: 360,
    fill: { type: 'solid', color: '#111111' },
    borderRadius: 32,
    semanticRole: 'hero',
    provenance: { source: 'template' }
  });

  const heroTitle = createNode('Text', 'Hero Title', {
    parentId: hero.id,
    x: 48,
    y: 52,
    width: 540,
    height: 120,
    textContent: 'Launch fintech flows from prompt to production.',
    typography: { fontFamily: 'Outfit', fontSize: 56, fontWeight: 700, lineHeight: 1.05, color: '#F8F7F2' },
    provenance: { source: 'template' }
  });

  const heroBody = createNode('Text', 'Hero Body', {
    parentId: hero.id,
    x: 48,
    y: 196,
    width: 470,
    height: 72,
    textContent: 'A living canvas that turns screenshots, chat and manual edits into clean React + Tailwind UI.',
    typography: { fontFamily: 'Outfit', fontSize: 18, fontWeight: 400, lineHeight: 1.45, color: '#CBC7BF' },
    provenance: { source: 'template' }
  });

  const cta = createNode('Button', 'Primary CTA', {
    parentId: hero.id,
    x: 48,
    y: 286,
    width: 188,
    height: 52,
    borderRadius: 999,
    fill: { type: 'solid', color: '#B8FF5A' },
    textContent: 'Generate a canvas',
    typography: { fontFamily: 'Outfit', fontSize: 15, fontWeight: 600, color: '#111111', textAlign: 'center' },
    provenance: { source: 'template' }
  });

  const previewCard = createNode('Card', 'Preview Card', {
    parentId: hero.id,
    x: 694,
    y: 44,
    width: 384,
    height: 272,
    fill: { type: 'solid', color: '#1A1A1A' },
    borderRadius: 28,
    provenance: { source: 'template' }
  });

  const pricingGrid = createNode('Grid', 'Pricing Grid', {
    parentId: frame.id,
    x: 32,
    y: 536,
    width: 1136,
    height: 296,
    layout: { mode: 'flex', direction: 'row', justify: 'space-between', align: 'stretch' },
    semanticRole: 'pricing',
    provenance: { source: 'template' }
  });

  const cards = Array.from({ length: 3 }, (_, index) =>
    createNode('Card', `Pricing Card ${index + 1}`, {
      parentId: pricingGrid.id,
      x: index * 384,
      y: 0,
      width: 352,
      height: 296,
      fill: { type: 'solid', color: index === 1 ? '#111111' : '#FFFFFF' },
      borderRadius: 28,
      textContent: index === 1 ? 'Scale' : index === 0 ? 'Starter' : 'Enterprise',
      typography: { fontFamily: 'Outfit', fontSize: 22, fontWeight: 600, color: index === 1 ? '#F5F2EC' : '#101010' },
      provenance: { source: 'template' },
      exportMeta: { componentName: 'PricingCard' }
    }),
  );

  const nodes = [
    frame,
    navbar,
    brand,
    hero,
    heroTitle,
    heroBody,
    cta,
    previewCard,
    pricingGrid,
    ...cards
  ];

  document.nodes = Object.fromEntries(nodes.map((node) => [node.id, node]));
  document.pages[page.id] = { ...page, rootIds: [frame.id] };
  document.nodes[frame.id] = { ...frame, children: [navbar.id, hero.id, pricingGrid.id] };
  document.nodes[navbar.id] = { ...navbar, children: [brand.id] };
  document.nodes[hero.id] = { ...hero, children: [heroTitle.id, heroBody.id, cta.id, previewCard.id] };
  document.nodes[pricingGrid.id] = { ...pricingGrid, children: cards.map((card) => card.id) };

  return document;
}
