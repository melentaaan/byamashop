import { useState } from 'react';
import { backend } from '../backend';
import { Icon } from '../components/Icon';
import { Spinner, useUi } from '../components/ui';
import { prepareImage } from '../lib/images';

/** Champ image : aperçu, envoi d'une photo (redimensionnée) ou adresse d'image. */
export function ImageField({ label, value, onChange, id }: { label: string; value: string | null; onChange: (url: string | null) => void; id: string }) {
  const [busy, setBusy] = useState(false);
  const { toast } = useUi();
  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const p = await prepareImage(file);
      const up = await backend.admin.uploadImage(p.full, null, { width: p.width, height: p.height, ext: p.ext });
      onChange(up.url);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Envoi impossible', { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="field image-field">
      <label htmlFor={id}>{label}</label>
      <div className="image-field-row">
        <span className="image-field-preview">{value ? <img src={value} alt="" /> : <Icon name="file" />}</span>
        <div className="image-field-controls">
          <input id={id} className="input input--sm" value={value && !value.startsWith('data:') ? value : ''} placeholder={value?.startsWith('data:') ? 'Image envoyée' : 'Adresse de l’image ou envoyez une photo'} onChange={(e) => onChange(e.target.value || null)} />
          <div className="cluster">
            <label className="btn btn--soft btn--sm">
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
              {busy ? <Spinner /> : <Icon name="upload" size={16} />} Envoyer une photo
            </label>
            {value && <button type="button" className="btn btn--ghost btn--sm" onClick={() => onChange(null)}>Retirer</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
