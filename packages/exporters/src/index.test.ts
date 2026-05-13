import { describe, expect, it } from 'vitest';

import { exportReactTailwind } from '@buildev/exporters';
import { createLandingPageSeed } from '@buildev/scene-graph';

describe('exporters', () => {
  it('exports a React + Tailwind file', () => {
    const result = exportReactTailwind(createLandingPageSeed());

    expect(result.entry).toBe('GeneratedPage.tsx');
    expect(result.files[0]?.content).toContain('export default function GeneratedPage');
    expect(result.files[0]?.content).toContain('className=');
  });
});
