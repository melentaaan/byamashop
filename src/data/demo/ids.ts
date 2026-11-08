/**
 * Identifiants déterministes pour le catalogue de démonstration :
 * le même identifiant est utilisé par le mode démo (navigateur) et par le seed SQL.
 */
function fnv1a(str: string, seed: number): number {
  let h = 0x811c9dc5 ^ seed;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function demoId(key: string): string {
  const parts = [0, 1, 2, 3].map((s) => fnv1a(key, s * 0x9e3779b1).toString(16).padStart(8, '0'));
  const hex = parts.join('');
  // format UUID v4 valide (version 4, variante RFC 4122)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16)}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

/** Petit générateur pseudo-aléatoire déterministe */
export function seededInt(key: string, min: number, max: number): number {
  return min + (fnv1a(key, 7) % (max - min + 1));
}
