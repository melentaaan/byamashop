import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { backend } from '../backend';
import { Icon } from '../components/Icon';
import { Spinner, useUi } from '../components/ui';
import { CSV_TEMPLATE, parseProductCsv, type CsvParseResult } from '../lib/csv';
import { formatFCFA } from '../lib/format';
import { ShopError } from '../lib/types';
import { useAdminInvalidate } from './hooks';

export default function ImportProducts() {
  const products = useQuery({ queryKey: ['admin', 'products'], queryFn: () => backend.admin.listProducts() });
  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: () => backend.admin.listCategories() });
  const [result, setResult] = useState<CsvParseResult | null>(null);
  const [progress, setProgress] = useState<{ done: number; failed: string[] } | null>(null);
  const [running, setRunning] = useState(false);
  const invalidate = useAdminInvalidate();
  const { toast } = useUi();

  const load = async (file?: File) => {
    if (!file || !categories.data || !products.data) return;
    const text = await file.text();
    setProgress(null);
    setResult(parseProductCsv(text, categories.data, products.data));
  };

  const run = async () => {
    if (!result) return;
    setRunning(true);
    const failed: string[] = [];
    let done = 0;
    for (const p of result.products) {
      try {
        const { line: _l, isUpdate: _u, ...input } = p;
        await backend.admin.saveProduct(input);
        done++;
      } catch (e) {
        failed.push(`${p.product.name} : ${e instanceof ShopError ? e.message : 'erreur'}`);
      }
      setProgress({ done, failed: [...failed] });
    }
    setRunning(false);
    invalidate();
    toast(`${done} produit${done > 1 ? 's' : ''} importé${done > 1 ? 's' : ''}`);
  };

  const template = () => {
    const blob = new Blob(['﻿' + CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'modele-import-produits.csv'; a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div className="admin-page">
      <div className="admin-head"><div><Link to="/admin/produits" className="back-link"><Icon name="arrow-left" size={16} /> Produits</Link><h1>Importer des produits (CSV)</h1><p className="muted">Ajoutez ou mettez à jour beaucoup de produits d’un coup depuis Excel ou Google Sheets.</p></div></div>
      <section className="admin-card form-grid">
        <h2>1. Préparer le fichier</h2>
        <ol className="steps-list">
          <li>Téléchargez le modèle et ouvrez-le dans Excel ou Google Sheets.</li>
          <li>Une ligne par variante (taille/couleur). Les lignes avec le même <code>slug</code> forment un seul produit ; pour un produit sans variante, une seule ligne suffit.</li>
          <li>Colonne <code>categorie</code> : nom ou adresse d’une catégorie existante. <code>prix</code> en FCFA, sans espace ni décimale. <code>statut</code> : en_ligne ou brouillon.</li>
          <li><code>images</code> : adresses des photos séparées par « | » (ou ajoutez les photos ensuite dans chaque fiche).</li>
          <li>Si un <code>slug</code> existe déjà, le produit est <strong>mis à jour</strong> (prix, stock…) au lieu d’être dupliqué.</li>
          <li>Enregistrez au format CSV (séparateur « ; » ou « , »).</li>
        </ol>
        <div><button className="btn btn--soft btn--sm" onClick={template}><Icon name="download" size={16} /> Télécharger le modèle</button></div>
      </section>
      <section className="admin-card form-grid">
        <h2>2. Vérifier</h2>
        <label className="btn btn--primary btn--sm import-btn">
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => load(e.target.files?.[0])} data-testid="csv-input" />
          <Icon name="upload" size={16} /> Choisir un fichier CSV
        </label>
        {result && (
          <>
            {result.issues.length > 0 && (
              <div className="alert alert--danger" role="alert"><Icon name="alert" /><div><strong>{result.issues.length} problème{result.issues.length > 1 ? 's' : ''} — ces produits ne seront pas importés :</strong><ul>{result.issues.slice(0, 30).map((i, k) => <li key={k}>Ligne {i.line} : {i.message}</li>)}</ul></div></div>
            )}
            <p><strong>{result.products.length}</strong> produit{result.products.length > 1 ? 's' : ''} prêt{result.products.length > 1 ? 's' : ''} : {result.products.filter((p) => !p.isUpdate).length} nouveau(x), {result.products.filter((p) => p.isUpdate).length} mise(s) à jour.</p>
            <div className="table-wrap">
              <table className="table" data-testid="import-preview">
                <thead><tr><th>Produit</th><th>Action</th><th>Prix</th><th>Variantes</th><th>Stock</th><th>Statut</th></tr></thead>
                <tbody>{result.products.map((p) => (
                  <tr key={p.product.slug}><td>{p.product.name}</td><td>{p.isUpdate ? 'Mise à jour' : 'Création'}</td><td>{formatFCFA(p.product.price)}</td><td>{p.variants.length}</td><td>{p.variants.reduce((s, v) => s + v.stock, 0)}</td><td>{p.product.status === 'published' ? 'En ligne' : p.product.status === 'draft' ? 'Brouillon' : 'Archivé'}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </>
        )}
      </section>
      {result && result.products.length > 0 && (
        <section className="admin-card form-grid">
          <h2>3. Importer</h2>
          <button className="btn btn--primary" onClick={run} disabled={running} data-testid="run-import">{running ? <Spinner /> : null} Importer {result.products.length} produit{result.products.length > 1 ? 's' : ''}</button>
          {progress && <p role="status">{progress.done} / {result.products.length} importé(s).{progress.failed.length > 0 && <> Échecs : {progress.failed.join(' ; ')}</>}</p>}
        </section>
      )}
    </div>
  );
}
