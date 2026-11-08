import type { ProductImage as Img, ProductWithRelations } from '../lib/types';

/** Image produit responsive (vignette 600 px + grande 1600 px quand disponibles). */
export function ProductImg({ image, alt, sizes, eager, className }: { image: Img | null | undefined; alt?: string; sizes?: string; eager?: boolean; className?: string }) {
  if (!image) return <NoPhoto className={className} />;
  const srcSet = image.thumb_url ? `${image.thumb_url} 600w, ${image.url} 1600w` : undefined;
  return (
    <img
      className={className}
      src={image.thumb_url ?? image.url}
      srcSet={srcSet}
      sizes={srcSet ? sizes ?? '(min-width: 1100px) 25vw, (min-width: 700px) 33vw, 50vw' : undefined}
      alt={alt ?? image.alt}
      width={image.width ?? 800}
      height={image.height ?? 1000}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : undefined}
      draggable={false}
    />
  );
}

/** Visuel neutre quand un produit n'a pas encore de photo. */
export function NoPhoto({ className }: { className?: string }) {
  return (
    <div className={`no-photo ${className ?? ''}`} role="img" aria-label="Photo à venir">
      <img src="/brand/mark.svg" alt="" width={56} height={60} />
      <span>Photo à venir</span>
    </div>
  );
}

export function ProductThumb({ product, size = 64 }: { product: Pick<ProductWithRelations, 'images' | 'name'>; size?: number }) {
  const img = product.images[0];
  return (
    <span className="thumb" style={{ width: size, height: Math.round(size * 1.25) }}>
      {img ? <img src={img.thumb_url ?? img.url} alt="" width={size} height={Math.round(size * 1.25)} loading="lazy" /> : <img src="/brand/mark.svg" alt="" className="thumb-mark" />}
    </span>
  );
}
