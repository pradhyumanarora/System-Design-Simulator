import type { DesignState } from '@sds/shared/src/index';

const KEY = 'sds:design';

export function saveDesign(state: DesignState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // quota exceeded — silently ignore
  }
}

export function loadDesign(): DesignState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DesignState;
  } catch {
    return null;
  }
}

export function clearDesign(): void {
  localStorage.removeItem(KEY);
}

export async function exportAsPng(selector = '.react-flow'): Promise<void> {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return;

  // Serialize the SVG inside ReactFlow and rasterize via OffscreenCanvas / Image
  const svgEl = el.querySelector<SVGSVGElement>('svg');
  if (!svgEl) {
    console.warn('No SVG found for PNG export.');
    return;
  }

  const { width, height } = el.getBoundingClientRect();
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svgEl);
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'system-design.png';
    a.click();
  };
  img.src = url;
}