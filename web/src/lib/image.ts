import type { Photo } from './types';

const MAX_SIDE = 1280;
export const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read that image.'));
    img.src = url;
  });
}

/** Reads a file, scales it to at most 1280 px on the long side, returns a JPEG data URL and size. */
export async function prepareFile(file: File): Promise<{ photo: Photo; base64: string }> {
  if (!file.type.startsWith('image/')) throw new Error('That file is not an image. Try a JPG, PNG or WEBP photo.');
  if (file.size > 25 * 1024 * 1024) throw new Error('That photo is over 25 MB. Try a smaller one.');
  const src = URL.createObjectURL(file);
  try {
    const img = await loadImage(src);
    const s = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * s), h = Math.round(img.naturalHeight * s);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
    const url = canvas.toDataURL('image/jpeg', 0.88);
    return { photo: { url, w, h }, base64: url.split(',')[1] };
  } finally {
    URL.revokeObjectURL(src);
  }
}
