/**
 * Préparation des photos dans le navigateur avant envoi :
 * redimensionnement (1600 px et vignette 600 px) et conversion WebP (JPEG en secours).
 * Allège fortement les photos prises au téléphone et accélère le site.
 */
export interface PreparedImage { full: Blob; thumb: Blob; width: number; height: number; ext: 'webp' | 'jpg' }

const MAX_INPUT_BYTES = 20 * 1024 * 1024;

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions); } catch { /* repli */ }
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image illisible'));
    img.src = URL.createObjectURL(file);
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function render(src: ImageBitmap | HTMLImageElement, maxSide: number): Promise<{ blob: Blob; width: number; height: number; ext: 'webp' | 'jpg' }> {
  const w0 = 'naturalWidth' in src ? src.naturalWidth : src.width;
  const h0 = 'naturalHeight' in src ? src.naturalHeight : src.height;
  const scale = Math.min(1, maxSide / Math.max(w0, h0));
  const width = Math.round(w0 * scale);
  const height = Math.round(h0 * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponible');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, width, height);
  const webp = await toBlob(canvas, 'image/webp', 0.82);
  if (webp && webp.type === 'image/webp') return { blob: webp, width, height, ext: 'webp' };
  const jpg = await toBlob(canvas, 'image/jpeg', 0.85);
  if (!jpg) throw new Error('Conversion impossible');
  return { blob: jpg, width, height, ext: 'jpg' };
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) throw new Error(`« ${file.name} » n’est pas une image.`);
  if (file.size > MAX_INPUT_BYTES) throw new Error(`« ${file.name} » est trop lourde (20 Mo maximum).`);
  const src = await loadBitmap(file);
  const full = await render(src, 1600);
  const thumb = await render(src, 600);
  return { full: full.blob, thumb: thumb.blob, width: full.width, height: full.height, ext: full.ext };
}
