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

        const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;

        const [resCfg, resPerfil] = await Promise.all([
          supabase
            .from('configuracoes_servidor')
            .select('cargo_admin_id, cargo_staff_id')
            .eq('guild_id', guildId)
            .maybeSingle(),
          supabase
            .from('perfis')
            .select('discord_id')
            .eq('id', session.user.id)
            .maybeSingle(),
        ]);

        const cfg      = resCfg.data;
        const discordId = resPerfil.data?.discord_id;

        if (!cfg || !discordId) {
          if (!cancelado) setPriv({ isAdmin: false, isStaff: false, carregando: false });
          return;
        }

        // Busca apenas o membro específico no Discord (mais eficiente que toda a lista)
        const resMembro = await fetch(`/api/discord/membro/${discordId}`);
        if (!resMembro.ok) {
          if (!cancelado) setPriv({ isAdmin: false, isStaff: false, carregando: false });
          return;
        }

        const membro = await resMembro.json();
        const roles: string[] = membro.roles || [];

        const isAdmin = cfg.cargo_admin_id ? roles.includes(cfg.cargo_admin_id) : false;
        const isStaff = isAdmin || (cfg.cargo_staff_id ? roles.includes(cfg.cargo_staff_id) : false);

        if (!cancelado) setPriv({ isAdmin, isStaff, carregando: false });
      } catch {
        if (!cancelado) setPriv({ isAdmin: false, isStaff: false, carregando: false });
      }
    })();

    return () => { cancelado = true; };
  }, []);

  return priv;
}
