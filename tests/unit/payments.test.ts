import { describe, expect, it } from 'vitest';
import { normalizeWaveLink, waveLinkOrNull } from '../../src/lib/payments';

describe('lien de paiement Wave', () => {
  it('accepte un lien pay.wave.com', () => {
    expect(normalizeWaveLink(' https://pay.wave.com/m/M_sn_abc123/c/sn/ ')).toBe('https://pay.wave.com/m/M_sn_abc123/c/sn/');
  });
  it('vide = pas de lien', () => {
    expect(normalizeWaveLink('')).toBe('');
    expect(waveLinkOrNull('')).toBeNull();
    expect(waveLinkOrNull(undefined)).toBeNull();
  });
  it('refuse tout autre site, http, identifiants ou adresse sans chemin', () => {
    for (const bad of [
      'http://pay.wave.com/m/abc',
      'https://pay.wave.com.evil.example/m/abc',
      'https://evil.example/pay.wave.com/m/abc',
      'https://user:pw@pay.wave.com/m/abc',
      'https://pay.wave.com/',
      'pay.wave.com/m/abc',
      'javascript:alert(1)',
    ]) {
      expect(normalizeWaveLink(bad), bad).toBeNull();
      expect(waveLinkOrNull(bad), bad).toBeNull();
    }
  });
});
