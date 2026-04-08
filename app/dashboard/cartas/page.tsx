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
  Auto:     () => <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5"><path d="M2 8a6 6 0 1 1 12 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><polyline points="10,5 12,8 14,5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/><line x1="8" y1="8" x2="8" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Pencil:   () => <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M9.5 1.5l3 3L4 13H1v-3L9.5 1.5Z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round"/></svg>,
  Move:     () => <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><polyline points="5,4 8,1 11,4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/><polyline points="5,12 8,15 11,12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>,
};

// ─── MAPEAMENTOS ──────────────────────────────────────────────────────────────
const CATEGORIAS = ['anime', 'serie', 'filme', 'desenho', 'jogo', 'musica', 'outro'] as const;
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
  desenho: Icons.Desenho, jogo: Icons.Jogo, musica: Icons.Musica, outro: Icons.Outro,
};
const LABEL_CATEGORIA: Record<string, string> = {
  anime:'Anime', serie:'Série', filme:'Filme', desenho:'Desenho', jogo:'Jogo', musica:'Música', outro:'Outro',
};
const EMOJI_DIS_RAR: Record<string, string> = { comum:'⚪', incomum:'🟢', raro:'🔵', epico:'🟣', lendario:'🟡' };
const EMOJI_DIS_CAT: Record<string, string> = { anime:'🎌', serie:'📺', filme:'🎬', desenho:'🖼️', jogo:'🎮', musica:'🎵', outro:'🌀' };
const EMOJI_DIS_GEN: Record<string, string> = { masculino:'♂️', feminino:'♀️', outros:'⚧️' };

const META: Record<string, { hex:string; border:string; bg:string; peso:number; ptsBase:number; glow:string; grad:string; label:string }> = {
  comum:    { hex:'#9CA3AF', border:'border-gray-400',   bg:'bg-gray-400/10',   peso:50, ptsBase:1,    glow:'rgba(156,163,175,0.4)', grad:'linear-gradient(170deg,#374151,#1F2937)', label:'Comum'    },
  incomum:  { hex:'#22C55E', border:'border-green-400',  bg:'bg-green-400/10',  peso:25, ptsBase:10,   glow:'rgba(34,197,94,0.45)',  grad:'linear-gradient(170deg,#14532D,#052e16)', label:'Incomum'  },
  raro:     { hex:'#3B82F6', border:'border-blue-400',   bg:'bg-blue-400/10',   peso:15, ptsBase:50,   glow:'rgba(59,130,246,0.5)',  grad:'linear-gradient(170deg,#1E3A8A,#0f172a)', label:'Raro'     },
  epico:    { hex:'#A855F7', border:'border-purple-400', bg:'bg-purple-400/10', peso:7,  ptsBase:200,  glow:'rgba(168,85,247,0.6)',  grad:'linear-gradient(170deg,#581C87,#1e0a3c)', label:'Épico'    },
  lendario: { hex:'#F59E0B', border:'border-yellow-400', bg:'bg-yellow-400/10', peso:3,  ptsBase:1000, glow:'rgba(245,158,11,0.75)', grad:'linear-gradient(170deg,#78350F,#1c0a00)', label:'Lendário' },
};

type Carta = {
  id:string; nome:string; personagem:string; vinculo:string;
  categoria:string; raridade:string; genero:string;
  imagem_url:string|null; imagem_r2_key:string|null;
  descricao:string|null; pontuacao:number|null; ativa:boolean; criado_por:string;
};
type FormCarta = {
  personagem:string; vinculo:string; categoria:string; raridade:string;
  genero:string; imagem_url:string|null; descricao:string|null;
};
const VAZIA: FormCarta = {
  personagem:'', vinculo:'', categoria:'anime', raridade:'comum',
  genero:'outros', imagem_url:null, descricao:null,
};
type EstadoRar = 'idle'|'buscando'|'detectada'|'manual'|'sem_api';

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

// ─── BADGE RARIDADE ───────────────────────────────────────────────────────────
function BadgeRaridade({estado,total,fonte,raridade,onManual}:{
  estado:EstadoRar;total:number;fonte:string;raridade:string;onManual:()=>void;
}) {
  const m=META[raridade]||META.comum;
  if(estado==='idle') return null;
  if(estado==='buscando') return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-gray-500 text-xs">
      <Icons.Spinner/><span>Detectando raridade...</span>
    </div>
  );
  if(estado==='sem_api') return (
    <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400/80 text-xs leading-relaxed">
      API não configurada ou quota esgotada. Configure <span className="font-bold font-mono">GOOGLE_API_KEY</span> + <span className="font-bold font-mono">GOOGLE_CX</span> na Vercel.
    </div>
  );
  if(estado==='manual') return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-gray-500 text-xs">
      <Icons.Pencil/><span>Raridade definida manualmente.</span>
    </div>
  );
  const fonteLabel:Record<string,string>={google:'Google',wikipedia:'Wikipedia','wikipedia-search':'Wikipedia'};
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl border" style={{background:m.hex+'0E',borderColor:m.hex+'35'}}>
      <div className="flex items-center gap-2">
        <span style={{color:m.hex}}><Icons.Auto/></span>
        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Auto • {fonteLabel[fonte]||fonte}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-gray-600">
          {total>=1_000_000?`${(total/1_000_000).toFixed(0)}M`:total>=1000?`${(total/1000).toFixed(0)}K`:total.toLocaleString('pt-BR')} ref.
        </span>
        <button type="button" onClick={onManual} className="text-[10px] text-gray-600 hover:text-white underline underline-offset-2 transition-colors">alterar</button>
      </div>
    </div>
  );
}

// ─── PREVIEW CARD 9:16 ───────────────────────────────────────────────────────
function PreviewCard({form,img,offsetY,onDragStart}:{
  form:FormCarta; img:string|null; offsetY:number; onDragStart:(e:React.MouseEvent|React.TouchEvent)=>void;
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
            style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:`center ${offsetY}%`,pointerEvents:'none',display:'block'}}/>
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
        <div style={{fontSize:13,fontWeight:900,color:'#fff',lineHeight:1.25,marginBottom:3}}>
          {form.personagem||<span style={{color:'#1F2937'}}>Personagem</span>}
        </div>
        <div style={{fontSize:9,color:m.hex,letterSpacing:'0.1em',textTransform:'uppercase'}}>
          {form.vinculo||<span style={{color:'#111827'}}>Vínculo</span>}
        </div>
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

// ─── PREVIEW DISCORD — exatamente como o bot vai enviar ─────────────────────
// O bot envia a imagem do card como ARQUIVO (não embed).
// O Discord mostra arquivos em tamanho grande + texto simples embaixo.
function PreviewEmbed({form,img}:{form:FormCarta;img:string|null}) {
  const m    = META[form.raridade]||META.comum;
  const pts  = (form.personagem&&form.vinculo) ? calcPts(form.raridade,form.personagem,form.vinculo) : null;
  const eR   = EMOJI_DIS_RAR[form.raridade]||'❔';
  const IRar = ICON_RARIDADE[form.raridade]||Icons.Comum;
  const ICat = ICON_CATEGORIA[form.categoria]||Icons.Outro;
  const IGen = ICON_GENERO[form.genero]||Icons.Outros;
  const isL  = form.raridade==='lendario';
  const isGif = img&&img.toLowerCase().endsWith('.gif');

  // Texto exato que o bot envia (igual ao roll.ts)
  const rarLabel = m.label;
  const ptsStr   = pts ? pts.toLocaleString('pt-BR')+' pts' : '—';

  return (
    <div style={{fontFamily:"'gg sans','Noto Sans',sans-serif",width:'100%',boxSizing:'border-box'}}>
      {/* cabeçalho bot */}
      <div style={{display:'flex',gap:8,alignItems:'flex-start',padding:'6px 8px 0',boxSizing:'border-box'}}>
        <div style={{width:32,height:32,borderRadius:'50%',flexShrink:0,background:'linear-gradient(135deg,#A855F7,#6D28D9)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🦉</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'baseline',gap:5,marginBottom:4,flexWrap:'wrap'}}>
            <span style={{color:'#A855F7',fontWeight:700,fontSize:12}}>Lua</span>
            <span style={{background:'#5865F2',color:'#fff',fontSize:7,padding:'1px 4px',borderRadius:3,fontWeight:700}}>BOT</span>
            <span style={{color:'#4E5058',fontSize:9}}>Hoje às 22:00</span>
          </div>
          {/* Texto simples — como o Discord renderiza markdown */}
          <div style={{color:'#DBDEE1',fontSize:11,lineHeight:1.5,marginBottom:6}}>
            <div><span style={{color:m.hex,fontWeight:700}}>{eR} {form.personagem||'Personagem'}</span>{' — '}{form.vinculo||'Vínculo'}</div>
            <div>{'✨ '}{rarLabel}{' • ⭐ '}{ptsStr}</div>
            <div style={{color:'#3BA55C',fontWeight:700}}>{'🆕 Nova carta adicionada à sua coleção!'}</div>
          </div>
        </div>
      </div>

      {/* Imagem do card — como o Discord exibe um arquivo anexado */}
      <div style={{
        marginLeft:40,
        borderRadius:8,
        overflow:'hidden',
        background:m.grad,
        border:`2px solid ${m.hex}55`,
        boxShadow:isL?`0 0 32px ${m.glow},0 0 64px ${m.glow}55`:`0 0 18px ${m.glow}`,
        animation:isL?'lend 2.5s ease-in-out infinite':'none',
        // Proporção 9:16 — mas limitamos largura para caber na coluna
        width:160,
        aspectRatio:'9/16',
        display:'flex',
        flexDirection:'column',
        position:'relative',
      }}>
        {/* linha brilhante topo */}
        <div style={{height:2,background:`linear-gradient(90deg,transparent,${m.hex},transparent)`,flexShrink:0}}/>
        {/* header raridade/categoria */}
        <div style={{padding:'5px 8px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${m.hex}22`,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:3}}>
            <span style={{color:m.hex,display:'flex'}}><IRar/></span>
            <span style={{fontSize:7,color:m.hex,fontWeight:900,letterSpacing:'0.1em',textTransform:'uppercase'}}>{m.label}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:2}}>
            <span style={{color:'#6B7280',display:'flex'}}><ICat/></span>
            <span style={{fontSize:7,color:'#6B7280'}}>{LABEL_CATEGORIA[form.categoria]}</span>
          </div>
        </div>
        {/* área imagem */}
        <div style={{
          flex:1,overflow:'hidden',position:'relative',
          background:img?'#000':`linear-gradient(135deg,${m.hex}14,${m.hex}30)`,
          display:'flex',alignItems:'center',justifyContent:'center',
        }}>
          {img ? (
            <img src={img} alt={form.personagem}
              style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'center 30%',display:'block'}}/>
          ) : (
            <svg viewBox="0 0 48 48" fill="none" style={{width:32,height:32,opacity:0.2}}>
              <rect x="4" y="4" width="40" height="40" rx="6" stroke={m.hex} strokeWidth="2"/>
              <line x1="4" y1="15" x2="44" y2="15" stroke={m.hex} strokeWidth="2"/>
            </svg>
          )}
          {isL&&<div style={{position:'absolute',inset:0,background:`linear-gradient(135deg,${m.hex}18 0%,transparent 55%,${m.hex}18 100%)`}}/>}
          {isGif&&<div style={{position:'absolute',top:4,left:4,background:'rgba(168,85,247,0.9)',borderRadius:3,padding:'1px 4px',fontSize:6,color:'#fff',fontWeight:900}}>GIF</div>}
          <div style={{position:'absolute',top:4,right:4,background:'rgba(0,0,0,0.65)',borderRadius:5,padding:3,display:'flex',color:'rgba(255,255,255,0.6)'}}><IGen/></div>
        </div>
        {/* nome / vínculo */}
        <div style={{padding:'5px 8px 3px',flexShrink:0}}>
          <div style={{fontSize:9,fontWeight:900,color:'#fff',textTransform:'uppercase',letterSpacing:'0.05em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{form.personagem||'Personagem'}</div>
          <div style={{fontSize:7,color:'#6B7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{form.vinculo||'Vínculo'}</div>
        </div>
        {/* footer pts */}
        <div style={{padding:'4px 8px',background:'rgba(0,0,0,0.38)',borderTop:`1px solid ${m.hex}22`,display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
          <span style={{fontSize:6,color:'#4B5563',letterSpacing:'0.08em'}}>PONTUAÇÃO</span>
          <span style={{fontSize:9,fontWeight:900,color:m.hex}}>{pts?pts.toLocaleString('pt-BR')+' pts':'—'}</span>
        </div>
      </div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function CartasPage() {
  const [cartas,setCartas]                   = useState<Carta[]>([]);
  const [total,setTotal]                     = useState(0);
  const [pagina,setPagina]                   = useState(1);
  const [busca,setBusca]                     = useState('');
  const [filtroCategoria,setFiltroCategoria] = useState('');
  const [filtroGenero,setFiltroGenero]       = useState('');
  const [loading,setLoading]                 = useState(true);
  const [modal,setModal]                     = useState(false);
  const [editando,setEditando]               = useState<Carta|null>(null);
  const [form,setForm]                       = useState<FormCarta>({...VAZIA});
  const [arquivoImagem,setArquivoImagem]     = useState<File|null>(null);
  const [previewImagem,setPreviewImagem]     = useState<string|null>(null);
  const [modoImagem,setModoImagem]           = useState<'url'|'upload'>('url');
  const [salvando,setSalvando]               = useState(false);
  const [msg,setMsg]                         = useState('');

  const [offsetY,setOffsetY]   = useState(30);
  const dragging               = useRef(false);
  const lastClientY            = useRef(0);
  const inputFileRef           = useRef<HTMLInputElement>(null);

  const onDragStart = useCallback((e: React.MouseEvent|React.TouchEvent) => {
    dragging.current = true;
    lastClientY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
    e.preventDefault();
  },[]);

  useEffect(()=>{
    const onMove=(e:MouseEvent|TouchEvent)=>{
      if(!dragging.current) return;
      const clientY='touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      const delta=clientY-lastClientY.current;
      lastClientY.current=clientY;
      setOffsetY(prev=>Math.max(0,Math.min(100,prev-(delta*0.4))));
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

  // ─── DETECÇÃO DE RARIDADE ─────────────────────────────────────────────────
  const [estadoRar,setEstadoRar] = useState<EstadoRar>('idle');
  const [totalRef,setTotalRef]   = useState(0);
  const [fonteRef,setFonteRef]   = useState('');
  const manualRef                = useRef(false);
  const debRef                   = useRef<ReturnType<typeof setTimeout>|null>(null);

  const detectarRaridade = useCallback(async(personagem:string, vinculo:string) => {
    // Dispara com pelo menos 2 caracteres — não precisa esperar o vínculo
    if(personagem.trim().length < 2){ setEstadoRar('idle'); return; }
    setEstadoRar('buscando');
    try {
      const p = new URLSearchParams({ personagem: personagem.trim() });
      if(vinculo.trim()) p.set('vinculo', vinculo.trim());
      const res = await fetch(`/api/cartas/raridade?${p}`);
      if(!res.ok) throw new Error('Erro na API');
      const data: { raridade:string; total:number; fonte?:string; sem_api?:boolean; quota?:boolean; erro?:string } = await res.json();
      setTotalRef(data.total ?? 0);
      setFonteRef(data.fonte || (data.sem_api ? 'sem_api' : data.quota ? 'quota' : 'google'));
      if(!manualRef.current){
        setForm(f=>({...f, raridade: data.raridade}));
        setEstadoRar(data.sem_api || data.quota ? 'sem_api' : 'detectada');
      }
    } catch { setEstadoRar('idle'); }
  },[]);

  useEffect(()=>{
    if(!modal) return;
    if(debRef.current) clearTimeout(debRef.current);
    if(manualRef.current) return;
    // Dispara assim que personagem tiver 2+ chars (vínculo é opcional)
    if(form.personagem.trim().length < 2){ setEstadoRar('idle'); return; }
    debRef.current = setTimeout(()=>detectarRaridade(form.personagem, form.vinculo), 800);
    return()=>{ if(debRef.current) clearTimeout(debRef.current); };
  },[form.personagem, form.vinculo, modal]);

  // ─── BUSCA CARTAS ─────────────────────────────────────────────────────────
  const buscarCartas=async()=>{
    setLoading(true);
    const p=new URLSearchParams({pagina:String(pagina),...(busca&&{busca}),...(filtroCategoria&&{categoria:filtroCategoria}),...(filtroGenero&&{genero:filtroGenero})});
    const res=await fetch(`/api/cartas?${p}`);
    if(res.ok){const d=await res.json();setCartas(d.cartas||[]);setTotal(d.total||0);}
    setLoading(false);
  };
  useEffect(()=>{buscarCartas();},[pagina,filtroCategoria,filtroGenero]);
  useEffect(()=>{
    const t=setTimeout(()=>{if(pagina===1)buscarCartas();else setPagina(1);},400);
    return()=>clearTimeout(t);
  },[busca]);

  // ─── MODAL ────────────────────────────────────────────────────────────────
  const abrirModal=(carta?:Carta)=>{
    manualRef.current=false; setEstadoRar('idle'); setTotalRef(0); setFonteRef(''); setOffsetY(30);
    if(carta){
      setEditando(carta);
      setForm({personagem:carta.personagem,vinculo:carta.vinculo,categoria:carta.categoria,
        raridade:carta.raridade,genero:carta.genero||'outros',imagem_url:carta.imagem_url,descricao:carta.descricao});
      setPreviewImagem(carta.imagem_url);
      setModoImagem(carta.imagem_r2_key?'upload':'url');
      manualRef.current=true; setEstadoRar('manual');
    } else {
      setEditando(null); setForm({...VAZIA}); setPreviewImagem(null); setModoImagem('url');
    }
    setArquivoImagem(null); setMsg(''); setModal(true);
  };
  const fecharModal=()=>{setModal(false);setEditando(null);if(debRef.current)clearTimeout(debRef.current);};

  const handleArquivo=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0]; if(!file) return;
    setArquivoImagem(file); setPreviewImagem(URL.createObjectURL(file)); setOffsetY(30);
  };

  const salvar=async()=>{
    if(!form.personagem||!form.vinculo||!form.categoria||!form.raridade||!form.genero){
      setMsg('err:Preencha todos os campos obrigatórios.'); return;
    }
    if(estadoRar==='buscando'){setMsg('err:Aguarde a detecção de raridade.');return;}
    setSalvando(true); setMsg('');
    try {
      const{data:{session}}=await supabase.auth.getSession();
      if(!session){setMsg('err:Sessão expirada.');return;}
      let imagemUrl=form.imagem_url, imagemR2Key=editando?.imagem_r2_key||null;
      if(modoImagem==='upload'&&arquivoImagem){
        const fd=new FormData();
        fd.append('imagem',arquivoImagem);
        if(editando?.id) fd.append('cartaId',editando.id);
        if(editando?.imagem_r2_key) fd.append('chaveAntiga',editando.imagem_r2_key);
        const ur=await fetch('/api/cartas/upload',{method:'POST',body:fd});
        if(!ur.ok) throw new Error('Falha no upload da imagem');
        const ud=await ur.json(); imagemUrl=ud.url; imagemR2Key=ud.chave;
      }
      const pontuacao=calcPts(form.raridade,form.personagem,form.vinculo);
      const payload={...form,nome:form.personagem,imagem_url:imagemUrl,imagem_r2_key:imagemR2Key,criado_por:session.user.id,pontuacao};
      const method=editando?'PATCH':'POST';
      const body=editando?{id:editando.id,...payload}:payload;
      const res=await fetch('/api/cartas',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      if(!res.ok){const d=await res.json();throw new Error(d.erro||'Erro ao salvar carta');}
      setMsg('ok'); await buscarCartas(); setTimeout(fecharModal,900);
    } catch(err:any){setMsg(`err:${err.message}`);}
    finally{setSalvando(false);}
  };

  const desativar=async(id:string)=>{
    if(!confirm('Desativar esta carta?')) return;
    await fetch(`/api/cartas?id=${id}`,{method:'DELETE'}); await buscarCartas();
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
      `}</style>

      {/* HEADER */}
      <header className="border-b border-white/10 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Coleção de <span className="text-fuchsia-400">Cartas</span></h1>
          <p className="text-gray-500 text-sm mt-1">{total} carta(s) cadastrada(s)</p>
        </div>
        <button onClick={()=>abrirModal()} className="flex items-center gap-2 px-6 py-3 bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-black rounded-xl uppercase text-sm tracking-widest transition-all">
          <Icons.Plus/> Nova Carta
        </button>
      </header>

      {/* FILTROS */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-60 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"><Icons.Search/></span>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar personagem, vínculo..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:border-fuchsia-500 outline-none transition-colors"/>
        </div>
        <div className="w-52"><Selector value={filtroCategoria} onChange={v=>{setFiltroCategoria(v);setPagina(1);}} options={optsFCat}/></div>
        <div className="w-48"><Selector value={filtroGenero}    onChange={v=>{setFiltroGenero(v);setPagina(1);}} options={optsFGen}/></div>
      </div>

      {/* GRID */}
      {loading?(
        <div className="text-center py-20 text-fuchsia-400 font-black text-xs tracking-widest animate-pulse">CARREGANDO...</div>
      ):cartas.length===0?(
        <div className="text-center py-20 text-gray-600 text-sm">Nenhuma carta encontrada.</div>
      ):(
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {cartas.map(carta=>{
            const m=META[carta.raridade]||META.comum;
            const IRar=ICON_RARIDADE[carta.raridade]||Icons.Comum;
            const IGen=ICON_GENERO[carta.genero]||Icons.Outros;
            const isGif=carta.imagem_url?.toLowerCase().endsWith('.gif');
            return (
              <div key={carta.id} className={`relative border-2 rounded-2xl overflow-hidden bg-black/40 transition-all hover:scale-[1.03] hover:shadow-xl ${m.border} ${m.bg}`}>
                <div className="relative w-full" style={{aspectRatio:'9/16'}}>
                  <div className="absolute inset-0 bg-gray-900/60">
                    {carta.imagem_url?(
                      <img src={carta.imagem_url} alt={carta.personagem} className="w-full h-full object-cover"/>
                    ):(
                      <div className="w-full h-full flex items-center justify-center" style={{color:m.hex,opacity:0.15}}>
                        <svg viewBox="0 0 48 48" fill="none" className="w-14 h-14"><rect x="4" y="4" width="40" height="40" rx="6" stroke="currentColor" strokeWidth="2"/><line x1="4" y1="15" x2="44" y2="15" stroke="currentColor" strokeWidth="2"/></svg>
                      </div>
                    )}
                    {isGif&&<div className="absolute top-2 left-2 bg-fuchsia-600/90 rounded-md px-1.5 py-0.5 text-[8px] text-white font-black">GIF</div>}
                    <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                      <div className="bg-black/65 rounded-lg p-1" style={{color:m.hex}}><IRar/></div>
                      <div className="bg-black/65 rounded-lg p-1 text-white/60"><IGen/></div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent p-3">
                      <p className="text-white font-black text-xs uppercase truncate">{carta.personagem}</p>
                      <p className="text-xs truncate" style={{color:m.hex+'aa'}}>{carta.vinculo}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2 flex gap-1.5">
                  <button onClick={()=>abrirModal(carta)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-black bg-white/5 hover:bg-fuchsia-500/25 text-white rounded-lg transition-all">
                    <Icons.Edit/> Editar
                  </button>
                  <button onClick={()=>desativar(carta.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-black bg-white/5 hover:bg-red-500/25 text-red-400 rounded-lg transition-all">
                    <Icons.Trash/> Desativar
                  </button>
                </div>
              </div>
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
                    onChange={e=>{manualRef.current=false;setForm(f=>({...f,personagem:e.target.value}));}}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-fuchsia-500 outline-none focus:ring-1 focus:ring-fuchsia-500/20 transition-all"
                    placeholder="Ex: Naruto Uzumaki"/>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Vínculo *</label>
                  <input value={form.vinculo}
                    onChange={e=>{manualRef.current=false;setForm(f=>({...f,vinculo:e.target.value}));}}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-fuchsia-500 outline-none focus:ring-1 focus:ring-fuchsia-500/20 transition-all"
                    placeholder="Ex: Naruto Shippuden"/>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Raridade *</label>
                    {(estadoRar==='detectada'||estadoRar==='manual')&&(
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest" style={{color:estadoRar==='detectada'?meta.hex:'#6B7280'}}>
                        {estadoRar==='detectada'?<><Icons.Auto/>Auto</>:<><Icons.Pencil/>Manual</>}
                      </span>
                    )}
                  </div>
                  <Selector value={form.raridade} onChange={v=>{manualRef.current=true;setEstadoRar('manual');setForm(f=>({...f,raridade:v}));}} options={optsRaridade} disabled={estadoRar==='buscando'}/>
                </div>
                <BadgeRaridade estado={estadoRar} total={totalRef} fonte={fonteRef} raridade={form.raridade} onManual={()=>{manualRef.current=true;setEstadoRar('manual');}}/>

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

                <div>
                  <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Imagem</label>
                  <div className="flex gap-2 mb-3">
                    {(['url','upload'] as const).map(modo=>(
                      <button key={modo} type="button" onClick={()=>setModoImagem(modo)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border ${modoImagem===modo?'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/50':'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>
                        {modo==='url'?<Icons.Link/>:<Icons.Upload/>}
                        {modo==='url'?'URL':'Upload'}
                      </button>
                    ))}
                  </div>
                  {modoImagem==='url'?(
                    <input value={form.imagem_url||''} onChange={e=>{
                      const v=e.target.value;
                      setForm(f=>({...f,imagem_url:v}));
                      setPreviewImagem(v||null);
                      if(v) setOffsetY(30);
                    }}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:border-fuchsia-500 outline-none focus:ring-1 focus:ring-fuchsia-500/20 transition-all"
                      placeholder="https://... (.jpg, .png, .gif, .webp)"/>
                  ):(
                    <>
                      <input ref={inputFileRef} type="file" accept="image/*,.gif" onChange={handleArquivo} className="hidden"/>
                      <button type="button" onClick={()=>inputFileRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-white/10 hover:border-fuchsia-500/40 rounded-xl text-gray-600 hover:text-gray-400 text-xs font-black transition-all">
                        <Icons.Upload/>
                        {arquivoImagem?arquivoImagem.name:'Clique para selecionar (imagem ou GIF)'}
                      </button>
                    </>
                  )}
                  {previewImagem&&(
                    <div className="mt-3 flex items-start gap-3">
                      <div className="shrink-0 rounded-xl overflow-hidden border border-white/10" style={{width:48,aspectRatio:'9/16',position:'relative'}}>
                        <img src={previewImagem} alt="thumb" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:`center ${offsetY}%`,display:'block'}}/>
                      </div>
                      <div className="flex flex-col gap-1.5 flex-1 pt-1">
                        <p className="text-[9px] text-gray-600 leading-relaxed">Arraste a imagem no preview do card para ajustar o enquadramento.</p>
                        <button type="button" onClick={()=>{setPreviewImagem(null);setArquivoImagem(null);setForm(f=>({...f,imagem_url:null}));}}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-gray-500 hover:text-red-400 text-[11px] font-black uppercase tracking-widest transition-all">
                          <Icons.Trash/> Remover imagem
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {msg&&msg!=='ok'&&(
                  <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-bold">
                    <Icons.Close/>{msg.replace('err:','')}
                  </div>
                )}
                {msg==='ok'&&(
                  <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/25 text-green-400 text-xs font-bold">
                    Carta salva com sucesso!
                  </div>
                )}

                <button type="button" onClick={salvar} disabled={salvando||estadoRar==='buscando'}
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
                    <span className="text-[9px] text-gray-600 flex items-center gap-1">
                      <Icons.Move/> Arraste a imagem para ajustar
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-start gap-4 cs">
                  <PreviewCard form={form} img={previewImagem} offsetY={offsetY} onDragStart={onDragStart}/>
                  <div className="grid grid-cols-2 gap-2" style={{width:200}}>
                    {[{label:'Spawn',value:`${meta.peso}%`},{label:'Pts base',value:meta.ptsBase.toLocaleString('pt-BR')}].map(i=>(
                      <div key={i.label} className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                        <div className="text-[8px] text-gray-600 font-black uppercase tracking-widest mb-1">{i.label}</div>
                        <div className="text-sm font-black" style={{color:meta.hex}}>{i.value}</div>
                      </div>
                    ))}
                  </div>
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
                    <PreviewEmbed form={form} img={previewImagem}/>
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <p className="text-[9px] text-gray-600 leading-relaxed">
                      O bot <span className="text-fuchsia-400/80 font-bold">Lua</span> envia a <strong className="text-gray-500">imagem do card</strong> como arquivo via <code className="font-mono text-gray-500">/roll</code> — sem embed, só a carta + texto. GIFs animam nativamente.
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