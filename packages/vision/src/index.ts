import { Jimp } from 'jimp';

import { createId } from '@buildev/shared';
import { createNode, type SceneNode } from '@buildev/scene-graph';

export interface ReverseUIResult {
  frame: SceneNode;
  nodes: SceneNode[];
  diagnostics: {
    sections: number;
    mode: 'heuristic';
  };
}

function decodeDataUrl(dataUrl: string): Buffer {
  const [, base64 = ''] = dataUrl.split(',');
  return Buffer.from(base64, 'base64');
}

function detectSections(image: Jimp): Array<{ y: number; height: number; density: number }> {
  const rows: number[] = [];
  for (let y = 0; y < image.bitmap.height; y += 4) {
    let ink = 0;
    for (let x = 0; x < image.bitmap.width; x += 4) {
      const pixel = image.getPixelColor(x, y);
      const { r, g, b } = Jimp.intToRGBA(pixel);
      const brightness = (r + g + b) / 3;
      if (brightness < 236) {
        ink += 1;
      }
    }
    rows.push(ink / Math.max(1, Math.floor(image.bitmap.width / 4)));
  }

  const sections: Array<{ start: number; end: number; density: number }> = [];
  let current: { start: number; end: number; density: number } | null = null;

  rows.forEach((value, index) => {
    if (value > 0.08) {
      if (!current) {
        current = { start: index * 4, end: index * 4, density: value };
      } else {
        current.end = index * 4;
        current.density = Math.max(current.density, value);
      }
    } else if (current) {
      sections.push(current);
      current = null;
    }
  });

  if (current) {
    sections.push(current);
  }

  return sections
    .map((section) => ({
      y: section.start,
      height: Math.max(section.end - section.start + 24, 72),
      density: section.density
    }))
    .filter((section) => section.height > 36)
    .slice(0, 8);
}

function detectColumns(image: Jimp, yStart: number, height: number): Array<{ x: number; width: number }> {
  const columns: number[] = [];
  const endY = Math.min(image.bitmap.height, yStart + height);

  for (let x = 0; x < image.bitmap.width; x += 4) {
    let ink = 0;
    for (let y = yStart; y < endY; y += 4) {
      const pixel = image.getPixelColor(x, y);
      const { r, g, b } = Jimp.intToRGBA(pixel);
      if ((r + g + b) / 3 < 232) {
        ink += 1;
      }
    }
    columns.push(ink / Math.max(1, Math.floor(height / 4)));
  }

  const groups: Array<{ start: number; end: number }> = [];
  let current: { start: number; end: number } | null = null;
  columns.forEach((value, index) => {
    if (value > 0.12) {
      if (!current) {
        current = { start: index * 4, end: index * 4 };
      } else {
        current.end = index * 4;
      }
    } else if (current) {
      groups.push(current);
      current = null;
    }
  });
  if (current) {
    groups.push(current);
  }

  return groups
    .map((group) => ({ x: group.start, width: Math.max(group.end - group.start + 16, 64) }))
    .filter((group) => group.width > 60)
    .slice(0, 4);
}

export async function reverseEngineerScreenshot(dataUrl: string): Promise<ReverseUIResult> {
  const image = await Jimp.read(decodeDataUrl(dataUrl));
  image.greyscale().contrast(0.2);

  const canvasWidth = Math.min(Math.max(image.bitmap.width, 640), 1440);
  const scale = canvasWidth / image.bitmap.width;
  const frame = createNode('Frame', 'Imported Screenshot Frame', {
    x: 48,
    y: 48,
    width: Math.round(image.bitmap.width * scale),
    height: Math.round(image.bitmap.height * scale),
    borderRadius: 24,
    fill: { type: 'solid', color: '#FCFBF8' },
    semanticRole: 'reconstructed-screen',
    provenance: { source: 'screenshot', confidence: 0.58 }
  });

  const sections = detectSections(image);
  const nodes: SceneNode[] = [];

  sections.forEach((section, index) => {
    const scaledY = Math.round(section.y * scale);
    const scaledHeight = Math.round(section.height * scale);
    const columns = detectColumns(image, section.y, section.height).map((column) => ({
      x: Math.round(column.x * scale),
      width: Math.round(column.width * scale)
    }));

    const sectionType =
      index === 0 && scaledHeight < 140
        ? 'Navbar'
        : columns.length >= 3
          ? 'Grid'
          : index === 1
            ? 'Card'
            : 'Container';

    const sectionNode = createNode(sectionType, `${sectionType} Section ${index + 1}`, {
      id: createId('vision'),
      parentId: frame.id,
      x: 24,
      y: Math.max(scaledY, 24),
      width: frame.width - 48,
      height: scaledHeight,
      borderRadius: sectionType === 'Navbar' ? 18 : 24,
      fill: { type: 'solid', color: sectionType === 'Navbar' ? '#FFFFFF' : '#F2EEE8' },
      semanticRole: sectionType.toLowerCase(),
      provenance: { source: 'screenshot', confidence: section.density }
    });

    nodes.push(sectionNode);

    if (columns.length >= 2) {
      columns.forEach((column, columnIndex) => {
        nodes.push(
          createNode('Card', `Detected Card ${index + 1}.${columnIndex + 1}`, {
            parentId: sectionNode.id,
            x: column.x,
            y: 20,
            width: Math.min(column.width, frame.width / 3),
            height: Math.max(scaledHeight - 32, 120),
            borderRadius: 20,
            fill: { type: 'solid', color: '#FFFFFF' },
            textContent: 'Detected card',
            provenance: { source: 'screenshot', confidence: 0.44 }
          }),
        );
      });
    } else {
      nodes.push(
        createNode('Text', `Detected Text ${index + 1}`, {
          parentId: sectionNode.id,
          x: 24,
          y: 20,
          width: Math.min(560, sectionNode.width - 48),
          height: Math.min(96, sectionNode.height - 32),
          textContent: index === 0 ? 'Detected navigation' : 'Detected content block',
          typography: { fontFamily: 'Outfit', fontSize: index === 0 ? 18 : 28, fontWeight: 600, color: '#1B1B1B' },
          provenance: { source: 'screenshot', confidence: 0.35, notes: ['ocr-not-enabled'] }
        }),
      );
    }
  });

  return {
    frame,
    nodes,
    diagnostics: {
      sections: sections.length,
      mode: 'heuristic'
    }
  };
}
