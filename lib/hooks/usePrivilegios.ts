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
        // Confirma que o usuário está autenticado
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (!cancelado) setPriv({ isAdmin: false, isStaff: false, carregando: false });
          return;
        }

        // Busca o discord_id do perfil (autenticado via Supabase client-side)
        const { data: perfil } = await supabase
          .from('perfis')
          .select('discord_id')
          .eq('id', session.user.id)
          .maybeSingle();

        const discordId = perfil?.discord_id as string | undefined;

        if (!discordId) {
          if (!cancelado) setPriv({ isAdmin: false, isStaff: false, carregando: false });
          return;
        }

        // Verifica privilégios no servidor (tem acesso às vars de ambiente seguras)
        const res = await fetch(`/api/privilegios?discord_id=${discordId}`);
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
