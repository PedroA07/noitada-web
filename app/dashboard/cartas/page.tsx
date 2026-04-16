"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ─── ÍCONES SVG ───────────────────────────────────────────────────────────────
const Icons = {
  Comum:    () => <svg viewBox="0 0 16 16" className="w-4 h-4"><circle cx="8" cy="8" r="6" fill="#9CA3AF"/></svg>,
  Incomum:  () => <svg viewBox="0 0 16 16" className="w-4 h-4"><polygon points="8,2 14,14 2,14" fill="#22C55E"/></svg>,
  Raro:     () => <svg viewBox="0 0 16 16" className="w-4 h-4"><rect x="3" y="3" width="10" height="10" rx="2" fill="#3B82F6"/></svg>,
  Epico:    () => <svg viewBox="0 0 16 16" className="w-4 h-4"><polygon points="8,1 10,6 15,6 11,9.5 12.5,15 8,11.5 3.5,15 5,9.5 1,6 6,6" fill="#A855F7"/></svg>,
  Lendario: () => <svg viewBox="0 0 16 16" className="w-4 h-4"><polygon points="8,1 9.8,6.2 15.5,6.2 10.9,9.8 12.7,15 8,11.4 3.3,15 5.1,9.8 0.5,6.2 6.2,6.2" fill="#F59E0B"/></svg>,
  Masculino:() => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><circle cx="6" cy="10" r="4.5" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round"/><line x1="9.5" y1="6.5" x2="14" y2="2" stroke="#60A5FA" strokeWidth="1.5"/><polyline points="11,2 14,2 14,5" stroke="#60A5FA" strokeWidth="1.5"/></svg>,
  Feminino: () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><circle cx="8" cy="6" r="4.5" stroke="#F472B6" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="10.5" x2="8" y2="14" stroke="#F472B6" strokeWidth="1.5"/><line x1="5.5" y1="12.5" x2="10.5" y2="12.5" stroke="#F472B6" strokeWidth="1.5"/></svg>,
  Outros:   () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><circle cx="8" cy="8" r="5.5" stroke="#A78BFA" strokeWidth="1.5"/><line x1="8" y1="5" x2="8" y2="8" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="10.5" r="0.8" fill="#A78BFA"/></svg>,
  Anime:    () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><circle cx="8" cy="8" r="5.5" stroke="#F97316" strokeWidth="1.5"/><circle cx="5.5" cy="7" r="1" fill="#F97316"/><circle cx="10.5" cy="7" r="1" fill="#F97316"/><path d="M5.5 10.5 Q8 12 10.5 10.5" stroke="#F97316" strokeWidth="1.2" fill="none" strokeLinecap="round"/></svg>,
  Serie:    () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><rect x="1.5" y="3" width="13" height="9" rx="1.5" stroke="#38BDF8" strokeWidth="1.5"/><line x1="5.5" y1="12" x2="4" y2="14" stroke="#38BDF8" strokeWidth="1.5"/><line x1="10.5" y1="12" x2="12" y2="14" stroke="#38BDF8" strokeWidth="1.5"/><line x1="3" y1="14" x2="13" y2="14" stroke="#38BDF8" strokeWidth="1.5"/></svg>,
  Filme:    () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="#FBBF24" strokeWidth="1.5"/><polygon points="6.5,6 6.5,10 11,8" fill="#FBBF24"/></svg>,
  Desenho:  () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M3 13 L13 3" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round"/><circle cx="13" cy="3" r="1.5" fill="#34D399"/><path d="M3 13 L2 14 L5 14 Z" fill="#34D399"/></svg>,
  Jogo:     () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><rect x="1" y="5" width="14" height="8" rx="3" stroke="#818CF8" strokeWidth="1.5"/><line x1="5" y1="7" x2="5" y2="11" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round"/><line x1="3" y1="9" x2="7" y2="9" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round"/><circle cx="11" cy="8.5" r="1" fill="#818CF8"/></svg>,
  Musica:   () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M6 12V4l8-2v8" stroke="#F472B6" strokeWidth="1.5" strokeLinecap="round"/><circle cx="4" cy="12" r="2" stroke="#F472B6" strokeWidth="1.5"/><circle cx="12" cy="10" r="2" stroke="#F472B6" strokeWidth="1.5"/></svg>,
  Outro:    () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><circle cx="8" cy="8" r="5.5" stroke="#A78BFA" strokeWidth="1.5" strokeDasharray="2 1.5"/></svg>,
  HQ:       () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="#F472B6" strokeWidth="1.5"/><line x1="2" y1="6" x2="14" y2="6" stroke="#F472B6" strokeWidth="1.5"/><line x1="6" y1="6" x2="6" y2="14" stroke="#F472B6" strokeWidth="1.5"/></svg>,
  Search:   () => <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/><line x1="12.5" y1="12.5" x2="17" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Close:    () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Edit:     () => <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3"><path d="M11 2L14 5L5 14H2V11L11 2Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/></svg>,
  Trash:    () => <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3"><polyline points="2,4 14,4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M5 4V2h6v2" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>,
  Link:     () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M6.5 9.5a3 3 0 0 0 4.24 0l2-2a3 3 0 0 0-4.24-4.24l-1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M9.5 6.5a3 3 0 0 0-4.24 0l-2 2a3 3 0 0 0 4.24 4.24l1-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Upload:   () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M3 11v2h10v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><polyline points="5,5 8,2 11,5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>,
  CardIcon: () => <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4"><rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><line x1="2" y1="7" x2="18" y2="7" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Discord:  () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M16.93 4.24A16.18 16.18 0 0 0 13 3a.06.06 0 0 0-.06.03c-.18.33-.37.76-.51 1.1a14.9 14.9 0 0 0-4.87 0 10.9 10.9 0 0 0-.52-1.1.06.06 0 0 0-.06-.03 16.14 16.14 0 0 0-3.93 1.24.06.06 0 0 0-.03.02C1.47 7.6.85 10.86 1.14 14.08a.07.07 0 0 0 .03.04 16.28 16.28 0 0 0 4.9 2.48.06.06 0 0 0 .07-.02c.38-.52.71-1.06 1-1.63a.06.06 0 0 0-.03-.09 10.72 10.72 0 0 1-1.53-.73.06.06 0 0 1-.01-.1l.31-.24a.06.06 0 0 1 .06-.01c3.2 1.46 6.67 1.46 9.83 0a.06.06 0 0 1 .06.01l.3.24a.06.06 0 0 1-.01.1c-.49.29-1 .53-1.53.73a.06.06 0 0 0-.03.09c.3.57.63 1.11 1 1.63a.06.06 0 0 0 .07.02 16.24 16.24 0 0 0 4.91-2.48.06.06 0 0 0 .03-.04c.35-3.63-.59-6.88-2.49-9.82a.05.05 0 0 0-.03-.02ZM7.17 12.18c-1.05 0-1.91-.97-1.91-2.15s.85-2.15 1.91-2.15c1.07 0 1.92.98 1.91 2.15 0 1.18-.85 2.15-1.91 2.15Zm7.07 0c-1.05 0-1.91-.97-1.91-2.15s.85-2.15 1.91-2.15c1.07 0 1.92.98 1.91 2.15 0 1.18-.84 2.15-1.91 2.15Z"/></svg>,
  Star:     () => <svg viewBox="0 0 14 14" fill="currentColor" className="w-3 h-3"><polygon points="7,1 8.5,5.2 13,5.2 9.5,8 10.8,12.5 7,10 3.2,12.5 4.5,8 1,5.2 5.5,5.2"/></svg>,
  ChevDown: () => <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><polyline points="2,4 6,8 10,4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Plus:     () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  Filter:   () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><polygon points="1,2 15,2 9.5,9 9.5,14 6.5,14 6.5,9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/></svg>,
  Spinner:  () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 animate-spin"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28 10" strokeLinecap="round"/></svg>,
  Pencil:   () => <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M9.5 1.5l3 3L4 13H1v-3L9.5 1.5Z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round"/></svg>,
  Move:     () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><polyline points="5,4 8,1 11,4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/><polyline points="5,12 8,15 11,12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>,
  ChevLeft: () => <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><polyline points="8,2 4,6 8,10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  ChevRight:() => <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><polyline points="4,2 8,6 4,10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Trophy:   () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M4 2h8v6a4 4 0 0 1-8 0V2Z" stroke="currentColor" strokeWidth="1.5"/><path d="M4 5H2a2 2 0 0 0 2 2M12 5h2a2 2 0 0 1-2 2" stroke="currentColor" strokeWidth="1.5"/><line x1="8" y1="12" x2="8" y2="14" stroke="currentColor" strokeWidth="1.5"/><line x1="5" y1="14" x2="11" y2="14" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Drag:     () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><circle cx="5" cy="4" r="1" fill="currentColor"/><circle cx="5" cy="8" r="1" fill="currentColor"/><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="4" r="1" fill="currentColor"/><circle cx="9" cy="8" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/></svg>,
  Eye:      () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5Z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Settings: () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Refresh:  () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M13.5 8A5.5 5.5 0 1 1 8 2.5c1.8 0 3.4.87 4.4 2.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><polyline points="12,1 12.4,4.7 9,5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>,
  RefreshSpin: () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 animate-spin"><path d="M13.5 8A5.5 5.5 0 1 1 8 2.5c1.8 0 3.4.87 4.4 2.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><polyline points="12,1 12.4,4.7 9,5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>,
  Layers:   () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><polygon points="8,1 15,5 8,9 1,5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M1 9l7 4 7-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  ChevUp:   () => <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><polyline points="2,8 6,4 10,8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
};

// ─── MAPEAMENTOS ──────────────────────────────────────────────────────────────
const CATEGORIAS = ['anime', 'serie', 'filme', 'desenho', 'jogo', 'musica', 'hq', 'outro'] as const;
const RARIDADES  = ['comum', 'incomum', 'raro', 'epico', 'lendario'] as const;
const GENEROS    = ['masculino', 'feminino', 'outros'] as const;

const ICON_RARIDADE: Record<string, () => JSX.Element> = {
  comum: Icons.Comum, incomum: Icons.Incomum, raro: Icons.Raro, epico: Icons.Epico, lendario: Icons.Lendario,
};
const ICON_GENERO: Record<string, () => JSX.Element> = {
  masculino: Icons.Masculino, feminino: Icons.Feminino, outros: Icons.Outros,
};
const ICON_CATEGORIA: Record<string, () => JSX.Element> = {
  anime: Icons.Anime, serie: Icons.Serie, filme: Icons.Filme,
  desenho: Icons.Desenho, jogo: Icons.Jogo, musica: Icons.Musica, hq: Icons.HQ, outro: Icons.Outro,
};
const LABEL_CATEGORIA: Record<string, string> = {
  anime:'Anime', serie:'Série', filme:'Filme', desenho:'Desenho', jogo:'Jogo', musica:'Música', hq:'HQ', outro:'Outro',
};
const EMOJI_DIS_RAR: Record<string, string> = { comum:'⚪', incomum:'🟢', raro:'🔵', epico:'🟣', lendario:'🟡' };

const META: Record<string, { hex:string; border:string; bg:string; peso:number; ptsBase:number; glow:string; grad:string; label:string }> = {
  comum:    { hex:'#9CA3AF', border:'border-gray-400',   bg:'bg-gray-400/10',   peso:50, ptsBase:1,    glow:'rgba(156,163,175,0.4)', grad:'linear-gradient(170deg,#374151,#1F2937)', label:'Comum'    },
  incomum:  { hex:'#22C55E', border:'border-green-400',  bg:'bg-green-400/10',  peso:25, ptsBase:10,   glow:'rgba(34,197,94,0.45)',  grad:'linear-gradient(170deg,#14532D,#052e16)', label:'Incomum'  },
  raro:     { hex:'#3B82F6', border:'border-blue-400',   bg:'bg-blue-400/10',   peso:15, ptsBase:50,   glow:'rgba(59,130,246,0.5)',  grad:'linear-gradient(170deg,#1E3A8A,#0f172a)', label:'Raro'     },
  epico:    { hex:'#A855F7', border:'border-purple-400', bg:'bg-purple-400/10', peso:7,  ptsBase:200,  glow:'rgba(168,85,247,0.6)',  grad:'linear-gradient(170deg,#581C87,#1e0a3c)', label:'Épico'    },
  lendario: { hex:'#F59E0B', border:'border-yellow-400', bg:'bg-yellow-400/10', peso:3,  ptsBase:1000, glow:'rgba(245,158,11,0.75)', grad:'linear-gradient(170deg,#78350F,#1c0a00)', label:'Lendário' },
};

// ─── TIPOS ────────────────────────────────────────────────────────────────────
type ImgCfg = { offset_x:number; offset_y:number; zoom:number };
type Carta = {
  id:string; nome:string; personagem:string; vinculo:string; sub_vinculo:string|null;
  categoria:string; raridade:string; genero:string;
  imagem_url:string|null; imagem_r2_key:string|null; imagens:string[];
  imagens_config:ImgCfg[]|null;
  imagem_offset_x:number|null; imagem_offset_y:number|null; imagem_zoom:number|null;
  descricao:string|null; pontuacao:number|null; ranking:number|null; ativa:boolean; criado_por:string;
  carta_principal_id:string|null; variacao_ordem:number;
};
type FormCarta = {
  personagem:string; vinculo:string; sub_vinculo:string; categoria:string; raridade:string;
  genero:string; imagem_url:string|null; imagens:string[]; imagens_config:ImgCfg[];
  imagem_offset_x:number; imagem_offset_y:number; imagem_zoom:number; descricao:string|null;
  carta_principal_id:string|null;
};
const VAZIA: FormCarta = {
  personagem:'', vinculo:'', sub_vinculo:'', categoria:'anime', raridade:'comum',
  genero:'outros', imagem_url:null, imagens:[], imagens_config:[],
  imagem_offset_x:50, imagem_offset_y:50, imagem_zoom:100,
  descricao:null, carta_principal_id:null,
};

function calcPts(r:string, n:string, v:string): number {
  const m=META[r]; if(!m) return 0;
  let h=0; const s=(n+v).toLowerCase();
  for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}
  return m.ptsBase+(Math.abs(h)%50);
}

// ─── SELETOR CUSTOMIZADO ──────────────────────────────────────────────────────
type SOpt={valor:string;label:string;Icon?:()=>JSX.Element;sub?:string};
function Selector({label,value,onChange,options,placeholder='Selecionar...',disabled}:{
  label?:string;value:string;onChange:(v:string)=>void;options:SOpt[];placeholder?:string;disabled?:boolean;
}) {
  const [open,setOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  const sel=options.find(o=>o.valor===value);
  useEffect(()=>{
    const fn=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false);};
    document.addEventListener('mousedown',fn); return()=>document.removeEventListener('mousedown',fn);
  },[]);
  return (
    <div ref={ref} className="relative">
      {label&&<label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">{label}</label>}
      <button type="button" onClick={()=>!disabled&&setOpen(v=>!v)} disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-black/40 border text-sm transition-all outline-none ${disabled?'opacity-50 cursor-not-allowed border-white/5':open?'border-fuchsia-500 ring-1 ring-fuchsia-500/20':'border-white/10 hover:border-white/25'}`}>
        <span className="flex items-center gap-2">
          {sel?.Icon&&<span className="text-gray-400"><sel.Icon/></span>}
          <span className={sel?'text-white':'text-gray-500'}>{sel?.label??placeholder}</span>
        </span>
        <span className={`text-gray-500 transition-transform ${open?'rotate-180':''}`}><Icons.ChevDown/></span>
      </button>
      {open&&!disabled&&(
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[70] bg-[#09090F] border border-fuchsia-500/30 rounded-xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.85)] s-drop">
          {options.map(opt=>(
            <button key={opt.valor} type="button" onClick={()=>{onChange(opt.valor);setOpen(false);}}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors border-b border-white/[0.04] last:border-0 ${value===opt.valor?'bg-fuchsia-500/15 text-fuchsia-400':'text-gray-300 hover:bg-white/[0.05] hover:text-white'}`}>
              {opt.Icon&&<span className={value===opt.valor?'text-fuchsia-400':'text-gray-500'}><opt.Icon/></span>}
              <span className="font-medium flex-1">{opt.label}</span>
              {opt.sub&&<span className="text-[10px] text-gray-600 font-mono">{opt.sub}</span>}
              {value===opt.valor&&<span className="text-fuchsia-400 text-xs font-black">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AUTOCOMPLETE INPUT ───────────────────────────────────────────────────────
function AutocompleteInput({label,value,onChange,campo,placeholder,required,disabled}:{
  label:string; value:string; onChange:(v:string)=>void;
  campo:'vinculo'|'sub_vinculo'; placeholder?:string; required?:boolean; disabled?:boolean;
}) {
  const [sugestoes,setSugestoes] = useState<string[]>([]);
  const [aberto,setAberto]       = useState(false);
  const [carregando,setCarregando] = useState(false);
  const debRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const ref    = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const fn=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setAberto(false);};
    document.addEventListener('mousedown',fn); return()=>document.removeEventListener('mousedown',fn);
  },[]);

  const buscar = useCallback(async(q:string)=>{
    if(q.trim().length<1){setSugestoes([]);setAberto(false);return;}
    setCarregando(true);
    try{
      const res=await fetch(`/api/cartas/vinculos?q=${encodeURIComponent(q.trim())}&campo=${campo}`);
      if(res.ok){const d=await res.json();setSugestoes(d);setAberto(d.length>0);}
    }catch{}finally{setCarregando(false);}
  },[campo]);

  const handleChange=(v:string)=>{
    onChange(v);
    if(debRef.current) clearTimeout(debRef.current);
    if(!v.trim()){setSugestoes([]);setAberto(false);return;}
    debRef.current=setTimeout(()=>buscar(v),300);
  };

  return (
    <div ref={ref} className="relative">
      <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">
        {label}{required&&' *'}
      </label>
      <div className="relative">
        <input value={value} onChange={e=>handleChange(e.target.value)} disabled={disabled}
          onFocus={()=>sugestoes.length>0&&setAberto(true)}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-fuchsia-500 outline-none focus:ring-1 focus:ring-fuchsia-500/20 transition-all disabled:opacity-40"
          placeholder={placeholder}/>
        {carregando&&<span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"><Icons.Spinner/></span>}
      </div>
      {aberto&&sugestoes.length>0&&(
        <div className="absolute top-[calc(100%+2px)] left-0 right-0 z-[80] bg-[#09090F] border border-fuchsia-500/30 rounded-xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.85)] s-drop">
          {sugestoes.map(s=>(
            <button key={s} type="button" onClick={()=>{onChange(s.trim());setSugestoes([]);setAberto(false);}}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/[0.05] hover:text-white border-b border-white/[0.04] last:border-0 transition-colors">
              <span className="text-gray-600"><Icons.Link/></span>
              <span className="flex-1 truncate">{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PREVIEW CARD 9:16 ───────────────────────────────────────────────────────
function PreviewCard({form,img,offsetY,offsetX,zoom,onDragStart}:{
  form:FormCarta; img:string|null; offsetY:number; offsetX:number; zoom:number; onDragStart:(e:React.MouseEvent|React.TouchEvent)=>void;
}) {
  const m=META[form.raridade]||META.comum;
  const IRar=ICON_RARIDADE[form.raridade]||Icons.Comum;
  const ICat=ICON_CATEGORIA[form.categoria]||Icons.Outro;
  const IGen=ICON_GENERO[form.genero]||Icons.Outros;
  const isL=form.raridade==='lendario';
  const pts=(form.personagem&&form.vinculo)?calcPts(form.raridade,form.personagem,form.vinculo):null;
  const isGif=img&&img.toLowerCase().endsWith('.gif');

  return (
    <div style={{
      width:200, borderRadius:20, overflow:'hidden',
      background:m.grad, border:`2px solid ${m.hex}55`,
      boxShadow:isL?`0 0 48px ${m.glow},0 0 96px ${m.glow}55`:`0 0 24px ${m.glow}`,
      fontFamily:'system-ui,sans-serif', position:'relative',
      animation:isL?'lend 2.5s ease-in-out infinite':'none',
      userSelect:'none',
    }}>
      <div style={{height:2,background:`linear-gradient(90deg,transparent,${m.hex},transparent)`}}/>
      <div style={{padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${m.hex}22`}}>
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          <span style={{color:m.hex,display:'flex'}}><IRar/></span>
          <span style={{fontSize:9,color:m.hex,fontWeight:900,letterSpacing:'0.12em',textTransform:'uppercase'}}>{m.label}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          <span style={{color:'#6B7280',display:'flex'}}><ICat/></span>
          <span style={{fontSize:9,color:'#6B7280'}}>{LABEL_CATEGORIA[form.categoria]}</span>
        </div>
      </div>
      <div style={{
        width:'100%', height:245, overflow:'hidden', position:'relative',
        background:img?'#000':`linear-gradient(135deg,${m.hex}14,${m.hex}30)`,
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor: img ? 'ns-resize' : 'default',
      }}
        onMouseDown={img?onDragStart:undefined}
        onTouchStart={img?onDragStart:undefined}
      >
        {img ? (
          <img src={img} alt="card" draggable={false}
            style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:`${zoom}%`,height:`${zoom}%`,minWidth:'100%',minHeight:'100%',maxWidth:'none',objectFit:'cover',objectPosition:`${offsetX}% ${offsetY}%`,pointerEvents:'none',display:'block'}}/>
        ) : (
          <svg viewBox="0 0 48 48" fill="none" style={{width:40,height:40,opacity:0.15,color:m.hex}}>
            <rect x="4" y="4" width="40" height="40" rx="6" stroke="currentColor" strokeWidth="2"/>
            <line x1="4" y1="15" x2="44" y2="15" stroke="currentColor" strokeWidth="2"/>
            <circle cx="20" cy="30" r="5" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )}
        {isL&&<div style={{position:'absolute',inset:0,background:`linear-gradient(135deg,${m.hex}18 0%,transparent 55%,${m.hex}18 100%)`,pointerEvents:'none'}}/>}
        <div style={{position:'absolute',top:7,right:7,background:'rgba(0,0,0,0.65)',borderRadius:7,padding:4,display:'flex',color:'#fff',pointerEvents:'none'}}><IGen/></div>
        {isGif&&<div style={{position:'absolute',top:7,left:7,background:'rgba(168,85,247,0.85)',borderRadius:5,padding:'2px 6px',fontSize:7,color:'#fff',fontWeight:900,letterSpacing:'0.1em',pointerEvents:'none'}}>GIF</div>}
        {img&&(
          <div style={{position:'absolute',bottom:6,left:'50%',transform:'translateX(-50%)',background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',borderRadius:20,padding:'3px 10px',display:'flex',alignItems:'center',gap:5,color:'rgba(255,255,255,0.5)',pointerEvents:'none'}}>
            <Icons.Move/><span style={{fontSize:8,fontWeight:900,letterSpacing:'0.08em'}}>ARRASTE</span>
          </div>
        )}
      </div>
      <div style={{padding:'10px 12px'}}>
        <div style={{fontSize:13,fontWeight:900,color:'#fff',lineHeight:1.3,marginBottom:3,wordBreak:'break-word'}}>
          {form.personagem||<span style={{color:'#1F2937'}}>Personagem</span>}
        </div>
        <div style={{fontSize:9,color:m.hex,letterSpacing:'0.1em',textTransform:'uppercase',wordBreak:'break-word',lineHeight:1.4}}>
          {form.vinculo||<span style={{color:'#111827'}}>Vínculo</span>}
        </div>
        {form.sub_vinculo&&(
          <div style={{fontSize:8,color:'#6B7280',letterSpacing:'0.06em',textTransform:'uppercase',marginTop:2,lineHeight:1.3}}>
            {form.sub_vinculo}
          </div>
        )}
        {form.descricao&&(
          <div style={{fontSize:8,color:'#6B7280',marginTop:6,lineHeight:1.5,borderTop:`1px solid ${m.hex}22`,paddingTop:6}}>
            {form.descricao.slice(0,60)}{form.descricao.length>60?'…':''}
          </div>
        )}
      </div>
      <div style={{padding:'7px 12px',background:'rgba(0,0,0,0.38)',borderTop:`1px solid ${m.hex}22`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:4,color:'#4B5563'}}>
          <Icons.Star/><span style={{fontSize:8,letterSpacing:'0.1em'}}>PTS</span>
        </div>
        <span style={{fontSize:12,fontWeight:900,color:m.hex}}>{pts?pts.toLocaleString('pt-BR'):'—'}</span>
      </div>
    </div>
  );
}

// ─── PREVIEW DISCORD ─────────────────────────────────────────────────────────
function PreviewEmbed({form,img,offsetY,offsetX,zoom,onDragStart}:{
  form:FormCarta; img:string|null; offsetY:number; offsetX:number; zoom:number; onDragStart:(e:React.MouseEvent|React.TouchEvent)=>void;
}) {
  const m    = META[form.raridade]||META.comum;
  const pts  = (form.personagem&&form.vinculo) ? calcPts(form.raridade,form.personagem,form.vinculo) : null;
  const eR   = EMOJI_DIS_RAR[form.raridade]||'❔';
  const IRar = ICON_RARIDADE[form.raridade]||Icons.Comum;
  const ICat = ICON_CATEGORIA[form.categoria]||Icons.Outro;
  const IGen = ICON_GENERO[form.genero]||Icons.Outros;
  const isL  = form.raridade==='lendario';
  const isGif = img&&img.toLowerCase().endsWith('.gif');
  const ptsStr = pts ? pts.toLocaleString('pt-BR')+' pts' : null;

  return (
    <div style={{fontFamily:"'gg sans','Noto Sans',sans-serif",width:'100%',boxSizing:'border-box',padding:'4px 6px 8px'}}>
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:6}}>
        <div style={{width:32,height:32,borderRadius:'50%',flexShrink:0,background:'linear-gradient(135deg,#06b6d4,#0891b2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none"><path d="M16 3L28 10v12L16 29 4 22V10L16 3z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="16" cy="16" r="3" fill="white"/></svg>
          </div>
        <div>
          <div style={{display:'flex',alignItems:'baseline',gap:5}}>
            <span style={{color:'#A855F7',fontWeight:700,fontSize:12}}>Lua</span>
            <span style={{background:'#5865F2',color:'#fff',fontSize:7,padding:'1px 4px',borderRadius:3,fontWeight:700}}>BOT</span>
            <span style={{color:'#4E5058',fontSize:9}}>Hoje às 22:00</span>
          </div>
        </div>
      </div>
      <div style={{color:'#DBDEE1',fontSize:11,lineHeight:1.6,marginBottom:8,marginLeft:40}}>
        <div><span style={{fontWeight:700,color:m.hex}}>{eR} {form.personagem||'Personagem'}</span>{' — '}{form.vinculo||'Vínculo'}{form.sub_vinculo?` / ${form.sub_vinculo}`:''}</div>
        <div>{m.label}{' • '}{ptsStr||'—'} pts</div>
        <div style={{color:'#3BA55C',fontWeight:700}}>{'Nova carta adicionada à sua coleção!'}</div>
      </div>
      <div style={{marginLeft:40}}>
        <div style={{
          width:180, borderRadius:20, overflow:'hidden',
          background:m.grad, border:`2px solid ${m.hex}55`,
          boxShadow:isL?`0 0 48px ${m.glow},0 0 96px ${m.glow}55`:`0 0 24px ${m.glow}`,
          fontFamily:'system-ui,sans-serif',
          animation:isL?'lend 2.5s ease-in-out infinite':'none',
          userSelect:'none',
        }}>
          <div style={{height:2,background:`linear-gradient(90deg,transparent,${m.hex},transparent)`}}/>
          <div style={{padding:'7px 11px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${m.hex}22`}}>
            <div style={{display:'flex',alignItems:'center',gap:5}}>
              <span style={{color:m.hex,display:'flex'}}><IRar/></span>
              <span style={{fontSize:8,color:m.hex,fontWeight:900,letterSpacing:'0.12em',textTransform:'uppercase'}}>{m.label}</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:4}}>
              <span style={{color:'#6B7280',display:'flex'}}><ICat/></span>
              <span style={{fontSize:8,color:'#6B7280'}}>{LABEL_CATEGORIA[form.categoria]}</span>
            </div>
          </div>
          <div style={{
            width:'100%', height:220, overflow:'hidden', position:'relative',
            background:img?'#000':`linear-gradient(135deg,${m.hex}14,${m.hex}30)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:img?'ns-resize':'default',
          }}
            onMouseDown={img?onDragStart:undefined}
            onTouchStart={img?onDragStart:undefined}
          >
            {img ? (
              <img src={img} alt="card" draggable={false}
                style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:`${zoom}%`,height:`${zoom}%`,minWidth:'100%',minHeight:'100%',maxWidth:'none',objectFit:'cover',objectPosition:`${offsetX}% ${offsetY}%`,pointerEvents:'none',display:'block'}}/>
            ) : (
              <svg viewBox="0 0 48 48" fill="none" style={{width:36,height:36,opacity:0.15,color:m.hex}}>
                <rect x="4" y="4" width="40" height="40" rx="6" stroke="currentColor" strokeWidth="2"/>
                <line x1="4" y1="15" x2="44" y2="15" stroke="currentColor" strokeWidth="2"/>
                <circle cx="20" cy="30" r="5" stroke="currentColor" strokeWidth="2"/>
              </svg>
            )}
            {isL&&<div style={{position:'absolute',inset:0,background:`linear-gradient(135deg,${m.hex}18 0%,transparent 55%,${m.hex}18 100%)`,pointerEvents:'none'}}/>}
            <div style={{position:'absolute',top:6,right:6,background:'rgba(0,0,0,0.65)',borderRadius:6,padding:4,display:'flex',color:'#fff',pointerEvents:'none'}}><IGen/></div>
            {isGif&&<div style={{position:'absolute',top:6,left:6,background:'rgba(168,85,247,0.85)',borderRadius:4,padding:'2px 5px',fontSize:7,color:'#fff',fontWeight:900,pointerEvents:'none'}}>GIF</div>}
          </div>
          <div style={{padding:'9px 11px'}}>
            <div style={{fontSize:12,fontWeight:900,color:'#fff',lineHeight:1.3,marginBottom:2,wordBreak:'break-word'}}>
              {form.personagem||<span style={{color:'#1F2937'}}>Personagem</span>}
            </div>
            <div style={{fontSize:8,color:m.hex,letterSpacing:'0.1em',textTransform:'uppercase',wordBreak:'break-word',lineHeight:1.4}}>
              {form.vinculo||<span style={{color:'#111827'}}>Vínculo</span>}
            </div>
            {form.sub_vinculo&&(
              <div style={{fontSize:7,color:'#6B7280',letterSpacing:'0.06em',textTransform:'uppercase',marginTop:2}}>
                {form.sub_vinculo}
              </div>
            )}
          </div>
          <div style={{padding:'6px 11px',background:'rgba(0,0,0,0.38)',borderTop:`1px solid ${m.hex}22`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:4,color:'#4B5563'}}>
              <Icons.Star/><span style={{fontSize:7,letterSpacing:'0.1em'}}>PTS</span>
            </div>
            <span style={{fontSize:11,fontWeight:900,color:m.hex}}>{pts?pts.toLocaleString('pt-BR'):'—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENTE CARTA CARD ───────────────────────────────────────────────────
function CartaCard({carta,modoEdicao,onEditar,onDesativar,badge,selecionada,onToggleSelect,modoBulk}:{
  carta:Carta; modoEdicao:boolean; onEditar:()=>void; onDesativar:()=>void; badge?:string;
  selecionada?:boolean; onToggleSelect?:()=>void; modoBulk?:boolean;
}) {
  const m    = META[carta.raridade]||META.comum;
  const IRar = ICON_RARIDADE[carta.raridade]||Icons.Comum;
  const ICat = ICON_CATEGORIA[carta.categoria]||Icons.Outro;
  const IGen = ICON_GENERO[carta.genero]||Icons.Outros;
  const isL  = carta.raridade==='lendario';
  const imgs = carta.imagens?.length ? carta.imagens : (carta.imagem_url ? [carta.imagem_url] : []);
  const [idx,setIdx] = useState(0);
  const img  = imgs[idx]||null;
  const isGif = img?.toLowerCase().endsWith('.gif');

  return (
    <div style={{
      borderRadius:20, overflow:'hidden',
      background:m.grad, border:`2px solid ${m.hex}55`,
      boxShadow:isL?`0 0 48px ${m.glow},0 0 96px ${m.glow}55`:`0 0 24px ${m.glow}`,
      fontFamily:'system-ui,sans-serif', position:'relative',
      animation:isL?'lend 2.5s ease-in-out infinite':'none',
      transition:'transform 0.15s,box-shadow 0.15s',
      display:'flex', flexDirection:'column',
    }}
      onMouseEnter={e=>!modoBulk&&(e.currentTarget.style.transform='scale(1.02)')}
      onMouseLeave={e=>!modoBulk&&(e.currentTarget.style.transform='scale(1)')}
    >
      {modoBulk&&(
        <div onClick={e=>{e.stopPropagation();onToggleSelect?.();}}
          style={{position:'absolute',inset:0,zIndex:20,cursor:'pointer',
            background:selecionada?'rgba(99,102,241,0.15)':'transparent',
            border:selecionada?'2px solid rgba(99,102,241,0.6)':'2px solid transparent',
            borderRadius:18,transition:'all 0.15s'}}>
          <div style={{position:'absolute',top:8,left:8,width:18,height:18,borderRadius:5,
            background:selecionada?'#6366f1':'rgba(0,0,0,0.75)',
            border:`2px solid ${selecionada?'#6366f1':'rgba(99,102,241,0.5)'}`,
            display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}>
            {selecionada&&<span style={{color:'#fff',fontSize:11,fontWeight:900,lineHeight:1}}>✓</span>}
          </div>
        </div>
      )}
      <div style={{height:2,background:`linear-gradient(90deg,transparent,${m.hex},transparent)`}}/>
      <div style={{padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${m.hex}22`}}>
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          <span style={{color:m.hex,display:'flex'}}><IRar/></span>
          <span style={{fontSize:9,color:m.hex,fontWeight:900,letterSpacing:'0.12em',textTransform:'uppercase'}}>{m.label}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          {badge&&<span style={{fontSize:7,background:m.hex+'22',color:m.hex,padding:'1px 5px',borderRadius:4,fontWeight:900,letterSpacing:'0.08em'}}>{badge}</span>}
          <span style={{color:'#6B7280',display:'flex'}}><ICat/></span>
          <span style={{fontSize:9,color:'#6B7280'}}>{LABEL_CATEGORIA[carta.categoria]}</span>
        </div>
      </div>
      <div style={{width:'100%',aspectRatio:'200/245',overflow:'hidden',position:'relative',background:img?'#000':`linear-gradient(135deg,${m.hex}14,${m.hex}30)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
        {img ? (
          <img src={img} alt={carta.personagem} draggable={false} style={{
            position:'absolute',top:'50%',left:'50%',
            transform:'translate(-50%,-50%)',
            width:`${carta.imagens_config?.[idx]?.zoom??carta.imagem_zoom??100}%`,height:`${carta.imagens_config?.[idx]?.zoom??carta.imagem_zoom??100}%`,
            minWidth:'100%',minHeight:'100%',maxWidth:'none',
            objectFit:'cover',
            objectPosition:`${carta.imagens_config?.[idx]?.offset_x??carta.imagem_offset_x??50}% ${carta.imagens_config?.[idx]?.offset_y??carta.imagem_offset_y??50}%`,
            display:'block',
          }}/>
        ) : (
          <svg viewBox="0 0 48 48" fill="none" style={{width:40,height:40,opacity:0.15,color:m.hex}}>
            <rect x="4" y="4" width="40" height="40" rx="6" stroke="currentColor" strokeWidth="2"/>
            <line x1="4" y1="15" x2="44" y2="15" stroke="currentColor" strokeWidth="2"/>
            <circle cx="20" cy="30" r="5" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )}
        {isL&&<div style={{position:'absolute',inset:0,background:`linear-gradient(135deg,${m.hex}18 0%,transparent 55%,${m.hex}18 100%)`,pointerEvents:'none'}}/>}
        <div style={{position:'absolute',top:7,right:7,background:'rgba(0,0,0,0.65)',borderRadius:7,padding:4,display:'flex',color:'#fff',pointerEvents:'none'}}><IGen/></div>
        {isGif&&<div style={{position:'absolute',top:7,left:7,background:'rgba(168,85,247,0.85)',borderRadius:5,padding:'2px 6px',fontSize:7,color:'#fff',fontWeight:900,letterSpacing:'0.1em',pointerEvents:'none'}}>GIF</div>}
        {imgs.length > 1 && (
          <>
            <div style={{position:'absolute',bottom:28,left:0,right:0,display:'flex',justifyContent:'space-between',padding:'0 6px',pointerEvents:'none'}}>
              <button onClick={e=>{e.stopPropagation();setIdx(i=>Math.max(0,i-1));}} disabled={idx===0}
                style={{pointerEvents:'all',background:'rgba(0,0,0,0.7)',border:'none',borderRadius:7,padding:4,color:'#fff',cursor:'pointer',opacity:idx===0?0.3:1,display:'flex'}}>
                <Icons.ChevLeft/>
              </button>
              <button onClick={e=>{e.stopPropagation();setIdx(i=>Math.min(imgs.length-1,i+1));}} disabled={idx===imgs.length-1}
                style={{pointerEvents:'all',background:'rgba(0,0,0,0.7)',border:'none',borderRadius:7,padding:4,color:'#fff',cursor:'pointer',opacity:idx===imgs.length-1?0.3:1,display:'flex'}}>
                <Icons.ChevRight/>
              </button>
            </div>
            <div style={{position:'absolute',bottom:10,left:0,right:0,display:'flex',justifyContent:'center',gap:4}}>
              {imgs.map((_,i)=>(
                <div key={i} onClick={e=>{e.stopPropagation();setIdx(i);}}
                  style={{width:i===idx?8:4,height:4,borderRadius:9999,cursor:'pointer',background:i===idx?m.hex:'rgba(255,255,255,0.3)',transition:'all 0.15s'}}/>
              ))}
            </div>
          </>
        )}
      </div>
      <div style={{padding:'10px 12px', flex:1}}>
        <div style={{fontSize:13,fontWeight:900,color:'#fff',lineHeight:1.3,marginBottom:3,wordBreak:'break-word'}}>
          {carta.personagem}
        </div>
        <div style={{fontSize:9,color:m.hex,letterSpacing:'0.1em',textTransform:'uppercase',wordBreak:'break-word',lineHeight:1.4}}>
          {carta.vinculo}
        </div>
        {carta.sub_vinculo&&(
          <div style={{fontSize:8,color:m.hex+'99',letterSpacing:'0.08em',textTransform:'uppercase',marginTop:3,lineHeight:1.3,wordBreak:'break-word',borderLeft:`2px solid ${m.hex}44`,paddingLeft:6}}>
            {carta.sub_vinculo}
          </div>
        )}
        {carta.descricao&&(
          <div style={{fontSize:8,color:'#6B7280',marginTop:6,lineHeight:1.5,borderTop:`1px solid ${m.hex}22`,paddingTop:6,wordBreak:'break-word'}}>
            {carta.descricao}
          </div>
        )}
      </div>
      <div style={{padding:'7px 12px',background:'rgba(0,0,0,0.38)',borderTop:`1px solid ${m.hex}22`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:4,color:m.hex}}>
          <Icons.Star/><span style={{fontSize:10,fontWeight:900,letterSpacing:'0.05em'}}>{carta.pontuacao?.toLocaleString('pt-BR')??'—'}</span>
        </div>
        {carta.ranking != null && carta.ranking > 0 && (
          <div style={{display:'flex',alignItems:'center',gap:4,color:'#4B5563'}}>
            <Icons.Trophy/><span style={{fontSize:10,fontWeight:900}}>#{carta.ranking}</span>
          </div>
        )}
      </div>
      {modoEdicao && (
        <div style={{padding:8,display:'flex',gap:6,borderTop:'1px solid rgba(255,255,255,0.06)'}}>
          <button onClick={onEditar} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'8px 0',fontSize:11,fontWeight:900,background:'rgba(255,255,255,0.05)',color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}}>
            <Icons.Edit/> Editar
          </button>
          <button onClick={onDesativar} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'8px 0',fontSize:11,fontWeight:900,background:'rgba(255,255,255,0.05)',color:'#F87171',border:'none',borderRadius:8,cursor:'pointer'}}>
            <Icons.Trash/> Desativar
          </button>
        </div>
      )}
    </div>
  );
}

// ─── GRUPO DE CARTAS (principal + variações) ─────────────────────────────────
function CartaGroup({principal,variacoes,modoEdicao,onEditar,onDesativar,onMoverVariacao,selecionadas,onToggleSelect,modoBulk}:{
  principal:Carta; variacoes:Carta[];
  modoEdicao:boolean;
  onEditar:(c:Carta)=>void;
  onDesativar:(id:string)=>void;
  onMoverVariacao:(id:string,dir:-1|1)=>void;
  selecionadas?:Set<string>; onToggleSelect?:(id:string)=>void; modoBulk?:boolean;
}) {
  const todas = [principal, ...variacoes.slice().sort((a,b)=>(a.variacao_ordem??0)-(b.variacao_ordem??0))];
  const [idx, setIdx] = useState(0);
  const atual = todas[idx] || principal;
  const m = META[atual.raridade]||META.comum;

  if(variacoes.length===0){
    return <CartaCard carta={principal} modoEdicao={modoEdicao} onEditar={()=>onEditar(principal)} onDesativar={()=>onDesativar(principal.id)}
      modoBulk={modoBulk} selecionada={selecionadas?.has(principal.id)} onToggleSelect={()=>onToggleSelect?.(principal.id)}/>;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Badge de grupo */}
      <div className="flex items-center gap-1.5 px-1">
        <span className="text-gray-600" style={{display:'flex'}}><Icons.Layers/></span>
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">{todas.length} cartas</span>
      </div>

      {/* Card atual */}
      <CartaCard
        carta={atual}
        modoEdicao={modoEdicao}
        onEditar={()=>onEditar(atual)}
        onDesativar={()=>onDesativar(atual.id)}
        badge={idx===0?'PRINCIPAL':`VAR. ${idx}`}
        modoBulk={modoBulk}
        selecionada={selecionadas?.has(atual.id)}
        onToggleSelect={()=>onToggleSelect?.(atual.id)}
      />

      {/* Navegação entre cartas do grupo */}
      {todas.length <= 5 ? (
        <div className="flex items-center justify-center gap-2">
          {todas.map((c,i)=>(
            <button key={c.id} type="button" onClick={()=>setIdx(i)}
              style={{
                width: i===idx ? 20 : 10, height:10, borderRadius:9999,
                background: i===idx ? (m.hex||'#fff') : 'rgba(255,255,255,0.15)',
                transition:'all 0.2s', border:'none', cursor:'pointer', padding:0,
                flexShrink:0,
              }}/>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <button type="button" onClick={()=>setIdx(i=>Math.max(0,i-1))} disabled={idx===0}
            style={{background:'rgba(255,255,255,0.07)',border:'none',borderRadius:7,padding:'3px 8px',color:m.hex,cursor:'pointer',opacity:idx===0?0.3:1,display:'flex',alignItems:'center'}}>
            <Icons.ChevLeft/>
          </button>
          <span style={{fontSize:10,fontWeight:900,color:m.hex,minWidth:36,textAlign:'center'}}>
            {idx+1} / {todas.length}
          </span>
          <button type="button" onClick={()=>setIdx(i=>Math.min(todas.length-1,i+1))} disabled={idx===todas.length-1}
            style={{background:'rgba(255,255,255,0.07)',border:'none',borderRadius:7,padding:'3px 8px',color:m.hex,cursor:'pointer',opacity:idx===todas.length-1?0.3:1,display:'flex',alignItems:'center'}}>
            <Icons.ChevRight/>
          </button>
        </div>
      )}

      {/* Controles de ordem — só em modo edição e em variações */}
      {modoEdicao && idx > 0 && (
        <div className="flex gap-1">
          <button type="button" onClick={()=>onMoverVariacao(atual.id,-1)}
            disabled={idx===1}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[9px] font-black uppercase text-gray-600 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all disabled:opacity-30 border border-white/5">
            <Icons.ChevLeft/> Mover
          </button>
          <button type="button" onClick={()=>onMoverVariacao(atual.id,1)}
            disabled={idx===todas.length-1}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[9px] font-black uppercase text-gray-600 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all disabled:opacity-30 border border-white/5">
            Mover <Icons.ChevRight/>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function CartasPage() {
  const [cartas,setCartas]                   = useState<Carta[]>([]);
  const [variacoes,setVariacoes]             = useState<Carta[]>([]);
  const [total,setTotal]                     = useState(0);
  const [pagina,setPagina]                   = useState(1);
  const [busca,setBusca]                     = useState('');
  const [filtroCategoria,setFiltroCategoria] = useState('');
  const [filtroGenero,setFiltroGenero]       = useState('');
  const [loading,setLoading]                 = useState(true);
  const [atualizando,setAtualizando]         = useState(false);
  const [modal,setModal]                     = useState(false);
  const [editando,setEditando]               = useState<Carta|null>(null);
  const [form,setForm]                       = useState<FormCarta>({...VAZIA});
  const [previewImagem,setPreviewImagem]     = useState<string|null>(null);
  const [salvando,setSalvando]               = useState(false);
  const [msg,setMsg]                         = useState('');
  const [modoEdicao,setModoEdicao]           = useState(false);
  const [toast,setToast]                     = useState<{msg:string;tipo:'ok'|'erro'}|null>(null);
  const toastRef                             = useRef<ReturnType<typeof setTimeout>|null>(null);

  // Estado de variação no formulário
  const [ehVariacao,setEhVariacao]                       = useState(false);
  const [buscaPrincipal,setBuscaPrincipal]               = useState('');
  const [resultadosPrincipal,setResultadosPrincipal]     = useState<Carta[]>([]);
  const [cartaPrincipalSel,setCartaPrincipalSel]         = useState<Carta|null>(null);
  const debPrincipal                                     = useRef<ReturnType<typeof setTimeout>|null>(null);

  // ── SELEÇÃO EM MASSA ──────────────────────────────────────────────────────
  const [modoBulk,setModoBulk]           = useState(false);
  const [selecionadas,setSelecionadas]   = useState<Set<string>>(new Set());
  const [modalBulk,setModalBulk]         = useState<'vinculo'|'sub_vinculo'|'variacoes'|null>(null);
  const [bulkValor,setBulkValor]         = useState('');
  const [bulkPrincipal,setBulkPrincipal] = useState<Carta|null>(null);
  const [bulkBusca,setBulkBusca]         = useState('');
  const [bulkResultados,setBulkResultados] = useState<Carta[]>([]);
  const [bulkSalvando,setBulkSalvando]   = useState(false);
  const debBulk                          = useRef<ReturnType<typeof setTimeout>|null>(null);

  const mostrarToast = useCallback((msg:string, tipo:'ok'|'erro'='ok')=>{
    setToast({msg,tipo});
    if(toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(()=>setToast(null), 3500);
  },[]);

  const [imgAtiva,setImgAtiva]               = useState(0);
  const [novaUrl,setNovaUrl]                 = useState('');
  const [ordenar,setOrdenar]                 = useState<'criado_em'|'pontuacao'|'raridade'|'ranking'>('criado_em');
  const [ordemDir,setOrdemDir]               = useState<'asc'|'desc'>('desc');

  const [offsetY,setOffsetY]   = useState(50);
  const [offsetX,setOffsetX]   = useState(50);
  const [zoom,setZoom]         = useState(100);
  const dragging               = useRef(false);
  const lastClientY            = useRef(0);
  const lastClientX            = useRef(0);

  // Refs para acesso sem closures obsoletas e para arrastar sem stale closure
  const imgAtivaRef      = useRef(0);
  const imagensConfigRef = useRef<ImgCfg[]>([]);
  const offsetXRef       = useRef(50);
  const offsetYRef       = useRef(50);

  // Mantém refs sincronizados
  useEffect(()=>{ imgAtivaRef.current = imgAtiva; },[imgAtiva]);
  useEffect(()=>{ imagensConfigRef.current = form.imagens_config ?? []; },[form.imagens_config]);

  // Ao mudar de imagem ativa: carrega a config salva dessa imagem (ou defaults se não existir)
  // Garante que cada imagem mostre SUA posição, sem herdar da imagem anterior
  useEffect(()=>{
    const url = form.imagens[imgAtiva];
    if(url) setPreviewImagem(url);
    const cfg = imagensConfigRef.current[imgAtiva];
    const ox = cfg?.offset_x ?? 50;
    const oy = cfg?.offset_y ?? 50;
    const z  = cfg?.zoom     ?? 100;
    offsetXRef.current = ox;
    offsetYRef.current = oy;
    setOffsetX(ox); setOffsetY(oy); setZoom(z);
    setForm(f=>({...f, imagem_offset_x:ox, imagem_offset_y:oy, imagem_zoom:z}));
  },[imgAtiva, form.imagens]);

  const onDragStart = useCallback((e: React.MouseEvent|React.TouchEvent) => {
    dragging.current = true;
    lastClientY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
    lastClientX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
    e.preventDefault();
  },[]);

  useEffect(()=>{
    const onMove=(e:MouseEvent|TouchEvent)=>{
      if(!dragging.current) return;
      const clientY='touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      const clientX='touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const deltaY=clientY-lastClientY.current;
      const deltaX=clientX-lastClientX.current;
      lastClientY.current=clientY;
      lastClientX.current=clientX;
      // Usa refs para calcular deltas e atualizar X+Y de uma só vez (evita mistura entre imagens)
      const vy = Math.max(0,Math.min(100, offsetYRef.current - deltaY*0.4));
      const vx = Math.max(0,Math.min(100, offsetXRef.current - deltaX*0.4));
      const ry = Math.round(vy);
      const rx = Math.round(vx);
      offsetYRef.current = vy;
      offsetXRef.current = vx;
      setOffsetY(vy);
      setOffsetX(vx);
      setForm(f=>{
        const cfg=[...(f.imagens_config??[])];
        const i=imgAtivaRef.current;
        cfg[i]={...(cfg[i]??{offset_x:50,offset_y:50,zoom:100}),offset_y:ry,offset_x:rx};
        return {...f,imagem_offset_y:ry,imagem_offset_x:rx,imagens_config:cfg};
      });
    };
    const onUp=()=>{dragging.current=false;};
    window.addEventListener('mousemove',onMove,{passive:false});
    window.addEventListener('mouseup',onUp);
    window.addEventListener('touchmove',onMove,{passive:false});
    window.addEventListener('touchend',onUp);
    return()=>{
      window.removeEventListener('mousemove',onMove);
      window.removeEventListener('mouseup',onUp);
      window.removeEventListener('touchmove',onMove);
      window.removeEventListener('touchend',onUp);
    };
  },[]);

  // ─── BUSCA CARTA PRINCIPAL (para variações) ───────────────────────────────
  const buscarPrincipalFn = useCallback(async(q:string)=>{
    if(q.trim().length<2){setResultadosPrincipal([]);return;}
    const res=await fetch(`/api/cartas?busca=${encodeURIComponent(q)}&so_principais=true`);
    if(res.ok){const d=await res.json();setResultadosPrincipal(d.cartas||[]);}
  },[]);

  const buscarPrincipalDebounced=(q:string)=>{
    setBuscaPrincipal(q);
    if(debPrincipal.current) clearTimeout(debPrincipal.current);
    debPrincipal.current=setTimeout(()=>buscarPrincipalFn(q),350);
  };

  // ─── BUSCA CARTAS ─────────────────────────────────────────────────────────
  const skipNextFetch = useRef(false);

  const buscarCartas = useCallback(async(scroll=false)=>{
    const p = new URLSearchParams();
    p.set('pagina',      String(pagina));
    p.set('ordenar',     ordenar);
    p.set('ordemDir',    ordemDir);
    p.set('so_principais','true');
    if(busca)           p.set('busca',     busca);
    if(filtroCategoria) p.set('categoria', filtroCategoria);
    if(filtroGenero)    p.set('genero',    filtroGenero);
    const res = await fetch(`/api/cartas?${p}`);
    if(res.ok){
      const d = await res.json();
      const principais: Carta[] = d.cartas||[];
      setCartas(principais);
      setTotal(d.total||0);

      // Busca variações das cartas desta página
      if(principais.length>0){
        const ids=principais.map(c=>c.id).join(',');
        const resVar=await fetch(`/api/cartas?principal_ids=${ids}`);
        if(resVar.ok){const dv=await resVar.json();setVariacoes(dv.cartas||[]);}
        else setVariacoes([]);
      } else {
        setVariacoes([]);
      }

      if(scroll) document.getElementById('cartas-grid')?.scrollIntoView({behavior:'smooth',block:'start'});
    }
    setLoading(false);
  },[pagina,busca,filtroCategoria,filtroGenero,ordenar,ordemDir]);

  useEffect(()=>{
    if(skipNextFetch.current){skipNextFetch.current=false;return;}
    buscarCartas(pagina>1);
  },[buscarCartas]);

  const mudarFiltro = useCallback((fn:()=>void)=>{
    if(pagina!==1){skipNextFetch.current=true;setPagina(1);}
    fn();
  },[pagina]);

  useEffect(()=>{
    const id = setInterval(()=>{ buscarCartas(false); }, 30_000);
    return () => clearInterval(id);
  },[buscarCartas]);

  const atualizarManual = useCallback(async()=>{
    setAtualizando(true);
    await buscarCartas(false);
    setAtualizando(false);
  },[buscarCartas]);

  // ─── MOVER VARIAÇÃO ───────────────────────────────────────────────────────
  const moverVariacao = useCallback(async(id:string, dir:-1|1)=>{
    const carta = variacoes.find(v=>v.id===id);
    if(!carta||carta.carta_principal_id===null) return;

    const irmans = variacoes
      .filter(v=>v.carta_principal_id===carta.carta_principal_id)
      .sort((a,b)=>(a.variacao_ordem??0)-(b.variacao_ordem??0));

    const idxAtual = irmans.findIndex(v=>v.id===id);
    const idxAlvo  = idxAtual+dir;
    if(idxAlvo<0||idxAlvo>=irmans.length) return;

    const alvo = irmans[idxAlvo];
    // Troca ordens
    await Promise.all([
      fetch('/api/cartas',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,variacao_ordem:alvo.variacao_ordem})}),
      fetch('/api/cartas',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:alvo.id,variacao_ordem:carta.variacao_ordem})}),
    ]);
    await buscarCartas();
  },[variacoes,buscarCartas]);

  // ─── MODAL ────────────────────────────────────────────────────────────────
  const abrirModal=(carta?:Carta)=>{
    setOffsetY(50); setOffsetX(50); setZoom(100);
    setEhVariacao(false); setCartaPrincipalSel(null); setBuscaPrincipal(''); setResultadosPrincipal([]);
    if(carta){
      setEditando(carta);
      const imgs = carta.imagens?.length ? carta.imagens : (carta.imagem_url ? [carta.imagem_url] : []);
      // Garante config por-imagem: usa imagens_config existente ou inicializa com a posição global da carta
      const cfgExist = carta.imagens_config?.length ? carta.imagens_config : null;
      const imgsCfg: ImgCfg[] = imgs.map((_,i)=>cfgExist?.[i]??{offset_x:carta.imagem_offset_x??50,offset_y:carta.imagem_offset_y??50,zoom:carta.imagem_zoom??100});
      const cfg0 = imgsCfg[0];
      setForm({
        personagem:carta.personagem, vinculo:carta.vinculo, sub_vinculo:carta.sub_vinculo||'',
        categoria:carta.categoria, raridade:carta.raridade, genero:carta.genero||'outros',
        imagem_url:imgs[0]||null, imagens:imgs, imagens_config:imgsCfg,
        imagem_offset_x:cfg0?.offset_x??50, imagem_offset_y:cfg0?.offset_y??50, imagem_zoom:cfg0?.zoom??100,
        descricao:carta.descricao, carta_principal_id:carta.carta_principal_id||null,
      });
      setPreviewImagem(imgs[0]||null);
      setOffsetX(cfg0?.offset_x??50);
      setOffsetY(cfg0?.offset_y??50);
      setZoom(cfg0?.zoom??100);
      // Se é uma variação, busca e exibe a carta principal
      if(carta.carta_principal_id){
        setEhVariacao(true);
        const principal = cartas.find(c=>c.id===carta.carta_principal_id) ||
                          variacoes.find(v=>v.id===carta.carta_principal_id);
        if(principal) setCartaPrincipalSel(principal as Carta);
      }
    } else {
      setEditando(null); setForm({...VAZIA}); setPreviewImagem(null);
    }
    setImgAtiva(0); setNovaUrl(''); setMsg(''); setModal(true);
  };
  const fecharModal=()=>{setModal(false);setEditando(null);setImgAtiva(0);setNovaUrl('');};

  const salvar=async()=>{
    if(!form.personagem||!form.vinculo||!form.categoria||!form.raridade||!form.genero){
      setMsg('err:Preencha todos os campos obrigatórios.'); return;
    }
    if(ehVariacao&&!form.carta_principal_id){
      setMsg('err:Selecione a carta principal para esta variação.'); return;
    }
    setSalvando(true); setMsg('');
    try {
      const{data:{session}}=await supabase.auth.getSession();
      if(!session){setMsg('err:Sessão expirada.');return;}

      const pontuacao=calcPts(form.raridade,form.personagem,form.vinculo);
      const primeiraImagem=form.imagens[0]||null;
      const payload={
        personagem:form.personagem.trim(), vinculo:form.vinculo.trim(), sub_vinculo:form.sub_vinculo.trim()||null,
        categoria:form.categoria, raridade:form.raridade, genero:form.genero,
        descricao:form.descricao, nome:form.personagem,
        imagem_url:primeiraImagem, imagem_r2_key:null, imagens:form.imagens, imagens_config:form.imagens_config,
        imagem_offset_x:form.imagem_offset_x, imagem_offset_y:form.imagem_offset_y, imagem_zoom:form.imagem_zoom,
        criado_por:session.user.id, pontuacao,
        carta_principal_id:ehVariacao ? form.carta_principal_id : null,
      };
      const method=editando?'PATCH':'POST';
      const body=editando?{id:editando.id,...payload}:payload;
      const res=await fetch('/api/cartas',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      if(!res.ok){const d=await res.json();throw new Error(d.erro||'Erro ao salvar carta');}
      await buscarCartas();
      fecharModal();
      mostrarToast(editando ? 'Carta atualizada com sucesso!' : 'Carta criada com sucesso!', 'ok');
    } catch(err:any){ mostrarToast(err.message||'Erro ao salvar carta', 'erro');}
    finally{setSalvando(false);}
  };

  const desativar=async(id:string)=>{
    if(!confirm('Desativar esta carta?')) return;
    await fetch(`/api/cartas?id=${id}`,{method:'DELETE'}); await buscarCartas();
  };

  const toggleSelect=(id:string)=>{
    setSelecionadas(prev=>{const n=new Set(prev);if(n.has(id))n.delete(id);else n.add(id);return n;});
  };

  const buscarBulkPrincipal=async(q:string)=>{
    if(q.trim().length<2){setBulkResultados([]);return;}
    const res=await fetch(`/api/cartas?busca=${encodeURIComponent(q)}&so_principais=true`);
    if(res.ok){const d=await res.json();setBulkResultados(d.cartas||[]);}
  };

  const salvarBulk=async()=>{
    if(selecionadas.size===0) return;
    setBulkSalvando(true);
    try {
      const ids=Array.from(selecionadas);
      let campos:Record<string,unknown>={};
      if(modalBulk==='vinculo'){
        if(!bulkValor.trim()){mostrarToast('Informe o vínculo','erro');setBulkSalvando(false);return;}
        campos={vinculo:bulkValor.trim()};
      } else if(modalBulk==='sub_vinculo'){
        campos={sub_vinculo:bulkValor.trim()||null};
      } else if(modalBulk==='variacoes'){
        if(!bulkPrincipal){mostrarToast('Selecione a carta principal','erro');setBulkSalvando(false);return;}
        const idsVar=ids.filter(id=>id!==bulkPrincipal.id);
        if(idsVar.length===0){mostrarToast('Nenhuma carta para vincular','erro');setBulkSalvando(false);return;}
        campos={carta_principal_id:bulkPrincipal.id};
        const res=await fetch('/api/cartas',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:idsVar,campos})});
        if(!res.ok){const d=await res.json();throw new Error(d.erro||'Erro');}
        await buscarCartas();
        setModalBulk(null);setSelecionadas(new Set());setBulkPrincipal(null);setBulkBusca('');setBulkResultados([]);setBulkValor('');
        mostrarToast(`${idsVar.length} carta(s) vinculada(s) como variação!`,'ok');
        return;
      }
      const res=await fetch('/api/cartas',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids,campos})});
      if(!res.ok){const d=await res.json();throw new Error(d.erro||'Erro');}
      await buscarCartas();
      setModalBulk(null);setSelecionadas(new Set());setBulkValor('');
      mostrarToast(`${ids.length} carta(s) atualizada(s)!`,'ok');
    } catch(err:any){mostrarToast(err.message||'Erro ao atualizar','erro');}
    finally{setBulkSalvando(false);}
  };

  const totalPaginas=Math.ceil(total/20);
  const meta=META[form.raridade]||META.comum;
  const optsRaridade  = RARIDADES.map(r=>({valor:r,label:META[r].label,Icon:ICON_RARIDADE[r],sub:`${META[r].peso}% spawn`}));
  const optsCategoria = CATEGORIAS.map(c=>({valor:c,label:LABEL_CATEGORIA[c],Icon:ICON_CATEGORIA[c]}));
  const optsGenero    = GENEROS.map(g=>({valor:g,label:g.charAt(0).toUpperCase()+g.slice(1),Icon:ICON_GENERO[g]}));
  const optsFCat=[{valor:'',label:'Todas as categorias',Icon:Icons.Filter},...optsCategoria];
  const optsFGen=[{valor:'',label:'Todos os gêneros',Icon:Icons.Filter},...optsGenero];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <style>{`
        @keyframes s-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}.s-drop{animation:s-in .15s ease}
        @keyframes lend{0%,100%{box-shadow:0 0 40px rgba(245,158,11,.7),0 0 80px rgba(245,158,11,.25)}50%{box-shadow:0 0 64px rgba(245,158,11,.9),0 0 128px rgba(245,158,11,.4)}}
        .cs::-webkit-scrollbar{width:4px}.cs::-webkit-scrollbar-track{background:transparent}.cs::-webkit-scrollbar-thumb{background:#1F2937;border-radius:4px}
        @keyframes toast-in{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        .toast-ani{animation:toast-in .25s ease}
      `}</style>

      {toast&&(
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl toast-ani border text-sm font-black ${toast.tipo==='ok'?'bg-green-500/20 border-green-500/40 text-green-400':'bg-red-500/20 border-red-500/40 text-red-400'}`}>
          {toast.tipo==='ok'
            ? <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
            : <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          }
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <header className="border-b border-white/10 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Coleção de <span className="text-fuchsia-400">Cartas</span></h1>
          <p className="text-gray-500 text-sm mt-1">{total} carta(s) principal(is)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={atualizarManual} disabled={atualizando}
            className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 font-black rounded-xl uppercase text-sm tracking-widest transition-all disabled:opacity-50">
            {atualizando ? <Icons.RefreshSpin/> : <Icons.Refresh/>} {atualizando?'Atualizando…':'Atualizar'}
          </button>
          <button onClick={()=>{setModoBulk(v=>{const n=!v;if(n){setModoEdicao(false);}else{setSelecionadas(new Set());setModalBulk(null);}return n;})}}
            className={`flex items-center gap-2 px-5 py-3 font-black rounded-xl uppercase text-sm tracking-widest transition-all border ${modoBulk?'bg-indigo-500/20 border-indigo-500/40 text-indigo-400':'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:border-white/20'}`}>
            <Icons.Layers/> {modoBulk?`${selecionadas.size} sel.`:'Selecionar'}
          </button>
          <button onClick={()=>{setModoEdicao(v=>{if(!v){setModoBulk(false);setSelecionadas(new Set());}return !v;})}}
            className={`flex items-center gap-2 px-5 py-3 font-black rounded-xl uppercase text-sm tracking-widest transition-all border ${modoEdicao?'bg-orange-500/20 border-orange-500/40 text-orange-400':'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:border-white/20'}`}>
            <Icons.Settings/> {modoEdicao?'Sair da edição':'Editar cartas'}
          </button>
          <button onClick={()=>abrirModal()} className="flex items-center gap-2 px-6 py-3 bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-black rounded-xl uppercase text-sm tracking-widest transition-all">
            <Icons.Plus/> Nova Carta
          </button>
        </div>
      </header>

      {/* FILTROS */}
      <div className="flex flex-wrap gap-3" id="cartas-grid">
        <div className="flex-1 min-w-60 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"><Icons.Search/></span>
          <input value={busca} onChange={e=>{const v=e.target.value; if(pagina!==1){skipNextFetch.current=true;setPagina(1);} setBusca(v);}} placeholder="Buscar personagem, vínculo..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:border-fuchsia-500 outline-none transition-colors"/>
        </div>
        <div className="w-52"><Selector value={filtroCategoria} onChange={v=>mudarFiltro(()=>setFiltroCategoria(v))} options={optsFCat}/></div>
        <div className="w-48"><Selector value={filtroGenero}    onChange={v=>mudarFiltro(()=>setFiltroGenero(v))} options={optsFGen}/></div>
        <div className="w-52">
          <Selector value={ordenar} onChange={v=>mudarFiltro(()=>setOrdenar(v as any))} options={[
            {valor:'criado_em', label:'Mais recentes'},
            {valor:'ranking',   label:'Ranking'},
            {valor:'pontuacao', label:'Pontuação'},
            {valor:'raridade',  label:'Raridade'},
          ]}/>
        </div>
        <button onClick={()=>mudarFiltro(()=>setOrdemDir(d=>d==='desc'?'asc':'desc'))}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all text-sm font-black"
          title={ordemDir==='desc'?'Ordem decrescente':'Ordem crescente'}>
          {ordemDir==='desc'?'↓':'↑'}
        </button>
      </div>

      {/* GRID */}
      {loading?(
        <div className="text-center py-20 text-fuchsia-400 font-black text-xs tracking-widest animate-pulse">CARREGANDO...</div>
      ):cartas.length===0?(
        <div className="text-center py-20 text-gray-600 text-sm">Nenhuma carta encontrada.</div>
      ):(
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {cartas.map(principal=>{
            const vars = variacoes.filter(v=>v.carta_principal_id===principal.id);
            return (
              <CartaGroup
                key={principal.id}
                principal={principal}
                variacoes={vars}
                modoEdicao={modoEdicao}
                onEditar={abrirModal}
                onDesativar={desativar}
                onMoverVariacao={moverVariacao}
                modoBulk={modoBulk}
                selecionadas={selecionadas}
                onToggleSelect={toggleSelect}
              />
            );
          })}
        </div>
      )}

      {/* PAGINAÇÃO */}
      {totalPaginas>1&&(
        <div className="flex justify-center items-center gap-4">
          <button onClick={()=>setPagina(p=>Math.max(1,p-1))} disabled={pagina===1} className="text-xs font-black uppercase text-gray-500 hover:text-white disabled:text-gray-700 transition-colors">Anterior</button>
          <span className="text-fuchsia-400 font-black text-xs bg-white/5 px-4 py-2 rounded-xl border border-fuchsia-500/20">{pagina} / {totalPaginas}</span>
          <button onClick={()=>setPagina(p=>Math.min(totalPaginas,p+1))} disabled={pagina===totalPaginas} className="text-xs font-black uppercase text-gray-500 hover:text-white disabled:text-gray-700 transition-colors">Próxima</button>
        </div>
      )}

      {/* ─── BULK ACTION BAR ────────────────────────────────────────────────── */}
      {modoBulk&&(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] flex flex-wrap items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl border bg-[#09090F] border-indigo-500/30">
          <span className={`font-black text-sm ${selecionadas.size>0?'text-indigo-400':'text-gray-500'}`}>
            {selecionadas.size>0?`${selecionadas.size} selecionada(s)`:'Clique nas cartas para selecionar'}
          </span>
          {selecionadas.size>0&&(<>
            <div className="w-px h-5 bg-white/10"/>
            <button onClick={()=>{setBulkValor('');setModalBulk('vinculo');}}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-400 text-xs font-black uppercase tracking-widest transition-all border border-white/[0.08] hover:border-indigo-500/30">
              <Icons.Link/> Definir vínculo
            </button>
            <button onClick={()=>{setBulkValor('');setModalBulk('sub_vinculo');}}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-400 text-xs font-black uppercase tracking-widest transition-all border border-white/[0.08] hover:border-indigo-500/30">
              <Icons.Link/> Definir sub-vínculo
            </button>
            <button onClick={()=>{setBulkPrincipal(null);setBulkBusca('');setBulkResultados([]);setModalBulk('variacoes');}}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-fuchsia-500/20 text-gray-400 hover:text-fuchsia-400 text-xs font-black uppercase tracking-widest transition-all border border-white/[0.08] hover:border-fuchsia-500/30">
              <Icons.Layers/> Adicionar como variações
            </button>
            <button onClick={()=>setSelecionadas(new Set())}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-600 hover:text-white text-xs font-black uppercase tracking-widest transition-all">
              Limpar
            </button>
          </>)}
          <div className="w-px h-5 bg-white/10"/>
          <button onClick={()=>{setModoBulk(false);setSelecionadas(new Set());setModalBulk(null);}}
            className="text-gray-600 hover:text-red-400 transition-colors p-1">
            <Icons.Close/>
          </button>
        </div>
      )}

      {/* ─── MODAL BULK ──────────────────────────────────────────────────────── */}
      {modalBulk&&(
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={()=>setModalBulk(null)}/>
          <div className="relative bg-[#07070F] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-[0_32px_80px_rgba(0,0,0,0.9)] space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">
                {modalBulk==='vinculo'?'Definir vínculo em massa':
                 modalBulk==='sub_vinculo'?'Definir sub-vínculo em massa':
                 'Adicionar como variações de...'}
              </h3>
              <button onClick={()=>setModalBulk(null)} className="text-gray-600 hover:text-red-400 transition-colors"><Icons.Close/></button>
            </div>
            <p className="text-xs text-gray-500">{selecionadas.size} carta(s) selecionada(s)</p>

            {(modalBulk==='vinculo'||modalBulk==='sub_vinculo')&&(
              <AutocompleteInput
                label={modalBulk==='vinculo'?'Novo vínculo':'Novo sub-vínculo'}
                value={bulkValor}
                onChange={setBulkValor}
                campo={modalBulk==='vinculo'?'vinculo':'sub_vinculo'}
                placeholder={modalBulk==='vinculo'?'Ex: Naruto Shippuden':'Ex: Arco da Dor (vazio para remover)'}
              />
            )}

            {modalBulk==='variacoes'&&(
              <div className="space-y-3">
                <p className="text-[9px] text-gray-600 leading-relaxed">
                  Busque a carta principal. Todas as cartas selecionadas serão vinculadas a ela como variações.
                </p>
                {bulkPrincipal?(
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30">
                    {bulkPrincipal.imagem_url&&<img src={bulkPrincipal.imagem_url} className="w-8 h-10 object-cover rounded-lg shrink-0" alt=""/>}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-black truncate">{bulkPrincipal.personagem}</div>
                      <div className="text-[10px] text-gray-500 truncate">{bulkPrincipal.vinculo}</div>
                    </div>
                    <button onClick={()=>{setBulkPrincipal(null);setBulkBusca('');setBulkResultados([]);}} className="text-gray-600 hover:text-red-400 transition-colors shrink-0"><Icons.Close/></button>
                  </div>
                ):(
                  <div className="relative">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"><Icons.Search/></span>
                      <input value={bulkBusca} onChange={e=>{
                        const q=e.target.value; setBulkBusca(q);
                        if(debBulk.current) clearTimeout(debBulk.current);
                        debBulk.current=setTimeout(()=>buscarBulkPrincipal(q),350);
                      }} placeholder="Buscar carta principal..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-white text-sm focus:border-fuchsia-500 outline-none focus:ring-1 focus:ring-fuchsia-500/20 transition-all"/>
                    </div>
                    {bulkResultados.length>0&&(
                      <div className="absolute top-[calc(100%+2px)] left-0 right-0 z-[80] bg-[#09090F] border border-fuchsia-500/30 rounded-xl overflow-hidden shadow-xl s-drop">
                        {bulkResultados.slice(0,6).map(c=>(
                          <button key={c.id} type="button" onClick={()=>{setBulkPrincipal(c);setBulkBusca('');setBulkResultados([]);}}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.05] border-b border-white/[0.04] last:border-0 transition-colors">
                            {c.imagem_url&&<img src={c.imagem_url} className="w-7 h-9 object-cover rounded-lg shrink-0" alt=""/>}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-white font-bold truncate">{c.personagem}</div>
                              <div className="text-[10px] text-gray-500 truncate">{c.vinculo}</div>
                            </div>
                            <span className="text-[9px] font-black shrink-0" style={{color:META[c.raridade]?.hex}}>{META[c.raridade]?.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <button type="button" onClick={salvarBulk} disabled={bulkSalvando}
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-black rounded-xl uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2">
              {bulkSalvando?<><Icons.Spinner/>Aplicando...</>:'Aplicar'}
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL ────────────────────────────────────────────────────────────── */}
      {modal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={fecharModal}/>
          <div className="relative bg-[#07070F] border border-white/[0.08] rounded-3xl w-full max-w-[1120px] shadow-[0_32px_80px_rgba(0,0,0,0.9)] flex flex-col max-h-[92vh]">

            <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.07] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-fuchsia-500"/>
                <h2 className="text-lg font-black text-white">{editando?'Editar Carta':'Nova Carta'}</h2>
              </div>
              <button onClick={fecharModal} className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-white/5"><Icons.Close/></button>
            </div>

            <div className="flex flex-1 min-h-0 overflow-hidden divide-x divide-white/[0.07]">

              {/* COL 1: FORMULÁRIO */}
              <div className="w-[340px] shrink-0 overflow-y-auto p-7 space-y-4 cs">

                <div>
                  <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Personagem *</label>
                  <input value={form.personagem}
                    onChange={e=>setForm(f=>({...f,personagem:e.target.value}))}
                    disabled={ehVariacao&&!!cartaPrincipalSel}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-fuchsia-500 outline-none focus:ring-1 focus:ring-fuchsia-500/20 transition-all disabled:opacity-40"
                    placeholder="Ex: Naruto Uzumaki"/>
                </div>

                <AutocompleteInput
                  label="Vínculo"
                  value={form.vinculo}
                  onChange={v=>setForm(f=>({...f,vinculo:v}))}
                  campo="vinculo"
                  placeholder="Ex: Naruto Shippuden"
                  required
                  disabled={ehVariacao&&!!cartaPrincipalSel}
                />

                <AutocompleteInput
                  label="Sub-vínculo"
                  value={form.sub_vinculo}
                  onChange={v=>setForm(f=>({...f,sub_vinculo:v}))}
                  campo="sub_vinculo"
                  placeholder="Ex: Arco da Dor (opcional)"
                />

                {/* Raridade — seleção manual */}
                <Selector label="Raridade *" value={form.raridade} onChange={v=>setForm(f=>({...f,raridade:v}))} options={optsRaridade}/>

                {form.personagem&&form.vinculo&&(
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl border" style={{background:meta.hex+'0C',borderColor:meta.hex+'30'}}>
                    <div className="flex items-center gap-2" style={{color:meta.hex}}><Icons.Star/><span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Pontuação</span></div>
                    <span className="font-black text-base" style={{color:meta.hex}}>{calcPts(form.raridade,form.personagem,form.vinculo).toLocaleString('pt-BR')} pts</span>
                  </div>
                )}

                <Selector label="Categoria *" value={form.categoria} onChange={v=>setForm(f=>({...f,categoria:v}))} options={optsCategoria}/>

                <div>
                  <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Gênero *</label>
                  <div className="flex gap-2">
                    {optsGenero.map(g=>(
                      <button key={g.valor} type="button" onClick={()=>setForm(f=>({...f,genero:g.valor}))}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border ${form.genero===g.valor?'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/50':'bg-black/40 border-white/10 text-gray-500 hover:border-white/20 hover:text-white'}`}>
                        <g.Icon/>{g.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Descrição</label>
                  <textarea value={form.descricao||''} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))} rows={2}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-fuchsia-500 outline-none resize-none focus:ring-1 focus:ring-fuchsia-500/20 transition-all"
                    placeholder="Descrição opcional..."/>
                </div>

                {/* ── VARIAÇÃO ── */}
                <div className="border border-white/[0.07] rounded-xl">
                  <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500"><Icons.Layers/></span>
                      <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">É uma variação?</span>
                    </div>
                    <button type="button" onClick={()=>{
                      const novo=!ehVariacao;
                      setEhVariacao(novo);
                      if(!novo){setCartaPrincipalSel(null);setForm(f=>({...f,carta_principal_id:null,personagem:f.personagem,vinculo:f.vinculo}));setBuscaPrincipal('');setResultadosPrincipal([]);}
                    }}
                      className={`relative w-10 h-5 rounded-full transition-all ${ehVariacao?'bg-fuchsia-500':'bg-white/10'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${ehVariacao?'left-[22px]':'left-0.5'}`}/>
                    </button>
                  </div>

                  {ehVariacao&&(
                    <div className="px-4 pb-4 pt-3 space-y-3 border-t border-white/[0.05]">
                      <p className="text-[9px] text-gray-600 leading-relaxed">
                        Vincule à carta principal. O personagem e vínculo serão copiados.
                      </p>
                      {cartaPrincipalSel ? (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30">
                          {cartaPrincipalSel.imagem_url&&(
                            <img src={cartaPrincipalSel.imagem_url} className="w-8 h-10 object-cover rounded-lg shrink-0" alt=""/>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white font-black truncate">{cartaPrincipalSel.personagem}</div>
                            <div className="text-[10px] text-gray-500 truncate">{cartaPrincipalSel.vinculo}</div>
                          </div>
                          <button type="button" onClick={()=>{
                            setCartaPrincipalSel(null);
                            setForm(f=>({...f,carta_principal_id:null,personagem:'',vinculo:''}));
                            setBuscaPrincipal('');
                          }} className="text-gray-600 hover:text-red-400 transition-colors shrink-0"><Icons.Close/></button>
                        </div>
                      ):(
                        <div className="relative">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"><Icons.Search/></span>
                            <input
                              value={buscaPrincipal}
                              onChange={e=>buscarPrincipalDebounced(e.target.value)}
                              placeholder="Buscar carta principal..."
                              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-white text-sm focus:border-fuchsia-500 outline-none focus:ring-1 focus:ring-fuchsia-500/20 transition-all"
                            />
                          </div>
                          {resultadosPrincipal.length>0&&(
                            <div className="absolute top-[calc(100%+2px)] left-0 right-0 z-[80] bg-[#09090F] border border-fuchsia-500/30 rounded-xl overflow-hidden shadow-xl s-drop">
                              {resultadosPrincipal.slice(0,6).map(c=>(
                                <button key={c.id} type="button" onClick={()=>{
                                  setCartaPrincipalSel(c);
                                  setForm(f=>({...f,carta_principal_id:c.id,personagem:c.personagem,vinculo:c.vinculo}));
                                  setBuscaPrincipal('');
                                  setResultadosPrincipal([]);
                                }}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.05] border-b border-white/[0.04] last:border-0 transition-colors">
                                  {c.imagem_url&&<img src={c.imagem_url} className="w-7 h-9 object-cover rounded-lg shrink-0" alt=""/>}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm text-white font-bold truncate">{c.personagem}</div>
                                    <div className="text-[10px] text-gray-500 truncate">{c.vinculo}</div>
                                  </div>
                                  <span className="text-[9px] font-black shrink-0" style={{color:META[c.raridade]?.hex}}>{META[c.raridade]?.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── IMAGENS ── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Imagens ({form.imagens.length}/10)</label>
                    <span className="text-[9px] text-gray-600">Arraste para reordenar</span>
                  </div>
                  {form.imagens.length < 10 && (
                    <div className="flex gap-2 mb-3">
                      <input value={novaUrl} onChange={e=>setNovaUrl(e.target.value)}
                        onKeyDown={e=>{
                          if(e.key==='Enter'&&novaUrl.trim()){
                            const url=novaUrl.trim();
                            const isFirst=form.imagens.length===0;
                            setForm(f=>{const cfg=[...(f.imagens_config??[])];cfg.push({offset_x:50,offset_y:50,zoom:100});return{...f,imagens:[...f.imagens,url],imagem_url:isFirst?url:f.imagem_url,imagens_config:cfg};});
                            if(isFirst){setPreviewImagem(url);setOffsetY(50);setOffsetX(50);setZoom(100);setImgAtiva(0);}
                            setNovaUrl('');
                          }
                        }}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono focus:border-fuchsia-500 outline-none transition-all"
                        placeholder="https://... (.jpg, .png, .gif, .webp)"/>
                      <button type="button" onClick={()=>{
                        if(!novaUrl.trim()) return;
                        const url=novaUrl.trim();
                        const isFirst=form.imagens.length===0;
                        setForm(f=>{const cfg=[...(f.imagens_config??[])];cfg.push({offset_x:50,offset_y:50,zoom:100});return{...f,imagens:[...f.imagens,url],imagem_url:isFirst?url:f.imagem_url,imagens_config:cfg};});
                        if(isFirst){setPreviewImagem(url);setOffsetY(50);setOffsetX(50);setZoom(100);setImgAtiva(0);}
                        setNovaUrl('');
                      }} className="px-3 py-2 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-400 border border-fuchsia-500/30 text-xs font-black transition-all">
                        <Icons.Plus/>
                      </button>
                    </div>
                  )}
                  {form.imagens.length > 0 ? (
                    <div className="space-y-1.5">
                      {form.imagens.map((url,idx)=>(
                        <div key={idx}
                          draggable
                          onDragStart={e=>e.dataTransfer.setData('idx',String(idx))}
                          onDragOver={e=>e.preventDefault()}
                          onDrop={e=>{
                            e.preventDefault();
                            const from=parseInt(e.dataTransfer.getData('idx'));
                            if(from===idx) return;
                            const arr=[...form.imagens];
                            arr.splice(idx,0,arr.splice(from,1)[0]);
                            const newActive=arr.indexOf(form.imagens[imgAtiva]);
                            setForm(f=>{const cfg=[...(f.imagens_config??[])];cfg.splice(idx,0,cfg.splice(from,1)[0]??{offset_x:50,offset_y:50,zoom:100});return{...f,imagens:arr,imagem_url:arr[0],imagens_config:cfg};});
                            setImgAtiva(Math.max(0,newActive));
                            setPreviewImagem(arr[Math.max(0,newActive)]||null);
                          }}
                          onClick={()=>{setImgAtiva(idx);}}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border cursor-pointer transition-all select-none ${imgAtiva===idx?'border-fuchsia-500/50 bg-fuchsia-500/10':'border-white/[0.07] bg-white/[0.02] hover:border-white/20'}`}>
                          <span className="text-gray-600 cursor-grab"><Icons.Drag/></span>
                          <div className="w-7 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-black/40">
                            <img src={url} alt="" className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display='none';}}/>
                          </div>
                          <span className="flex-1 text-[10px] text-gray-500 font-mono truncate">{url.split('/').pop()?.slice(0,28)||'imagem'}</span>
                          <span className={`text-[8px] font-black ${imgAtiva===idx?'text-fuchsia-400':'text-gray-700'}`}>#{idx+1}</span>
                          <button type="button" onClick={e=>{
                            e.stopPropagation();
                            const arr=form.imagens.filter((_,i)=>i!==idx);
                            const newActive=Math.min(imgAtiva,Math.max(0,arr.length-1));
                            setForm(f=>{const cfg=(f.imagens_config??[]).filter((_,i)=>i!==idx);return{...f,imagens:arr,imagem_url:arr[0]||null,imagens_config:cfg};});
                            setImgAtiva(newActive);
                          }} className="text-gray-700 hover:text-red-400 transition-colors p-1 shrink-0">
                            <Icons.Close/>
                          </button>
                        </div>
                      ))}
                    </div>
                  ):(
                    <p className="text-[9px] text-gray-700 text-center py-2">Nenhuma imagem. Adicione uma URL acima.</p>
                  )}
                </div>

                {msg&&<p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{msg.replace('err:','')}</p>}

                <button type="button" onClick={salvar} disabled={salvando}
                  className="w-full py-3 bg-fuchsia-500 hover:bg-fuchsia-400 disabled:opacity-50 text-white font-black rounded-xl uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2">
                  {salvando?<><Icons.Spinner/>Salvando...</>:editando?'Salvar Alterações':'Criar Carta'}
                </button>
              </div>

              {/* COL 2: CARD VISUAL */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.07] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500"><Icons.CardIcon/></span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Card Visual — Site</span>
                  </div>
                  {previewImagem&&(
                    <div className="flex items-center gap-3">
                      {form.imagens.length > 1 && (
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={()=>setImgAtiva(i=>Math.max(0,i-1))} disabled={imgAtiva===0}
                            className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-gray-500 hover:text-white disabled:opacity-30 transition-all"><Icons.ChevLeft/></button>
                          <span className="text-[9px] text-gray-600 font-black">{imgAtiva+1}/{form.imagens.length}</span>
                          <button type="button" onClick={()=>setImgAtiva(i=>Math.min(form.imagens.length-1,i+1))} disabled={imgAtiva===form.imagens.length-1}
                            className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-gray-500 hover:text-white disabled:opacity-30 transition-all"><Icons.ChevRight/></button>
                        </div>
                      )}
                      <span className="text-[9px] text-gray-600 flex items-center gap-1">
                        <Icons.Move/> Mover • Slider zoom
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-start gap-4 cs">
                  <PreviewCard form={form} img={previewImagem} offsetY={offsetY} offsetX={offsetX} zoom={zoom} onDragStart={onDragStart}/>
                  <div className="grid grid-cols-2 gap-2" style={{width:200}}>
                    {[{label:'Spawn',value:`${meta.peso}%`},{label:'Pts base',value:meta.ptsBase.toLocaleString('pt-BR')}].map(i=>(
                      <div key={i.label} className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                        <div className="text-[8px] text-gray-600 font-black uppercase tracking-widest mb-1">{i.label}</div>
                        <div className="text-sm font-black" style={{color:meta.hex}}>{i.value}</div>
                      </div>
                    ))}
                  </div>
                  {previewImagem&&(
                    <div style={{width:200}} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Zoom</span>
                        <span className="text-[9px] font-black" style={{color:meta.hex}}>{zoom}%</span>
                      </div>
                      <input type="range" min={100} max={300} step={5} value={zoom}
                        onChange={e=>{const v=Number(e.target.value);setZoom(v);setForm(f=>{const cfg=[...(f.imagens_config??[])];const i=imgAtivaRef.current;cfg[i]={...(cfg[i]??{offset_x:50,offset_y:50,zoom:100}),zoom:v};return{...f,imagem_zoom:v,imagens_config:cfg};});}}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{accentColor:meta.hex}}/>
                      <button type="button" onClick={()=>{offsetXRef.current=50;offsetYRef.current=50;setZoom(100);setOffsetY(50);setOffsetX(50);setForm(f=>{const cfg=[...(f.imagens_config??[])];cfg[imgAtivaRef.current]={offset_x:50,offset_y:50,zoom:100};return{...f,imagem_zoom:100,imagem_offset_y:50,imagem_offset_x:50,imagens_config:cfg};});}}
                        className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-600 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all border border-white/[0.05]">
                        Resetar posição
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* COL 3: EMBED DISCORD */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.07] flex items-center gap-2 shrink-0">
                  <span className="text-[#7289DA]"><Icons.Discord/></span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Preview — Discord</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 cs">
                  <div style={{background:'#313338',borderRadius:8,padding:'8px 4px'}}>
                    <PreviewEmbed form={form} img={previewImagem} offsetY={offsetY} offsetX={offsetX} zoom={zoom} onDragStart={onDragStart}/>
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <p className="text-[9px] text-gray-600 leading-relaxed">
                      O bot <span className="text-fuchsia-400/80 font-bold">Lua</span> envia o card como imagem (arquivo) via <code className="font-mono text-gray-500">/roll</code> — sem embed, exatamente como aparece no site. GIFs animam nativamente.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
