'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Privilegios = { isAdmin: boolean; isStaff: boolean; carregando: boolean };

/** Verifica se o usuário autenticado tem cargo de admin ou staff no Discord. */
export function usePrivilegios(): Privilegios {
  const [priv, setPriv] = useState<Privilegios>({ isAdmin: false, isStaff: false, carregando: true });

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (!cancelado) setPriv({ isAdmin: false, isStaff: false, carregando: false });
          return;
        }

        const res = await fetch('/api/privilegios', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok) {
          if (!cancelado) setPriv({ isAdmin: false, isStaff: false, carregando: false });
          return;
        }

        const { isAdmin, isStaff } = await res.json();
        if (!cancelado) setPriv({ isAdmin: !!isAdmin, isStaff: !!isStaff, carregando: false });
      } catch {
        if (!cancelado) setPriv({ isAdmin: false, isStaff: false, carregando: false });
      }
    })();

    return () => { cancelado = true; };
  }, []);

  return priv;
}
