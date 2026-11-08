import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { CATALOG_KEY } from '../hooks/useCatalog';

/** Rafraîchit les données d'administration et le catalogue public après une modification. */
export function useAdminInvalidate() {
  const qc = useQueryClient();
  return useCallback(() => {
    qc.invalidateQueries({ queryKey: ['admin'] });
    qc.invalidateQueries({ queryKey: CATALOG_KEY });
  }, [qc]);
}
