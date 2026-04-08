"use client";

import { useState, useEffect, useRef } from 'react';

type Vista = 'dias' | 'meses' | 'anos';

export function CalendarPicker({
  value,
  onChange,
  label,
  placeholder = 'Selecione a data',
}: {
  value: string;
  onChange: (date: string) => void;
  label: string;
  placeholder?: string;
}) {
  const [mostrar, setMostrar] = useState(false);
  const [vista, setVista] = useState<Vista>('dias');
  const [calMes, setCalMes] = useState(new Date().getMonth());
  const [calAno, setCalAno] = useState(new Date().getFullYear());
  const [anoInicio, setAnoInicio] = useState(Math.floor(new Date().getFullYear() / 12) * 12);
  const [digitando, setDigitando] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const MESES_CURTOS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMostrar(false);
        setVista('dias');
        setDigitando('');
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => {
    if (mostrar && value) {
      const [y, m] = value.split('-');
      if (y && m) {
        setCalAno(parseInt(y));
        setCalMes(parseInt(m) - 1);
        setAnoInicio(Math.floor(parseInt(y) / 12) * 12);
      }
    }
  }, [mostrar]);

  const gerarDias = () => {
    const inicio = new Date(calAno, calMes, 1).getDay();
    const total = new Date(calAno, calMes + 1, 0).getDate();
    const dias: (number | null)[] = [];
    for (let i = 0; i < inicio; i++) dias.push(null);
    for (let i = 1; i <= total; i++) dias.push(i);
    return dias;
  };

  const selecionarDia = (dia: number) => {
    const d = String(dia).padStart(2, '0');
    const m = String(calMes + 1).padStart(2, '0');
    onChange(`${calAno}-${m}-${d}`);
    setMostrar(false);
    setVista('dias');
    setDigitando('');
  };

  const navMes = (dir: number) => {
    let m = calMes + dir, a = calAno;
    if (m < 0) { m = 11; a--; }
    else if (m > 11) { m = 0; a++; }
    setCalMes(m); setCalAno(a);
  };

  const handleDigitar = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/[^\d/]/g, '');
    if (v.length === 2 && digitando.length === 1 && !v.includes('/')) v += '/';
    else if (v.length === 5 && digitando.length === 4 && v.split('/').length === 2) v += '/';
    setDigitando(v);
    const p = v.split('/');
    if (p.length === 3 && p[2].length === 4) {
      const [dd, mm, yyyy] = p.map(Number);
      if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12 && yyyy >= 1900 && yyyy <= 2099) {
        onChange(`${yyyy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`);
        setCalMes(mm - 1);
        setCalAno(yyyy);
        setAnoInicio(Math.floor(yyyy / 12) * 12);
      }
    }
  };

  const [anoV, mesV, diaV] = value ? value.split('-') : ['','',''];
  const exibir = value ? `${diaV}/${mesV}/${anoV}` : placeholder;
  const diaNum = value ? parseInt(diaV) : null;
  const mesNum = value ? parseInt(mesV) - 1 : null;
  const anoNum = value ? parseInt(anoV) : null;
  const anos = Array.from({ length: 12 }, (_, i) => anoInicio + i);

  return (
    <div className="relative" ref={ref}>
      <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2">{label}</label>

      <div
        onClick={() => { setMostrar(v => !v); setVista('dias'); }}
        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white cursor-pointer flex items-center justify-between hover:border-fuchsia-500 transition-all"
      >
        <span className={value ? 'text-white' : 'text-gray-500'}>{exibir}</span>
        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>

      {mostrar && (
        <div className="absolute top-full mt-2 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-[9999] p-4">

          {/* Digitação manual */}
          <input
            type="text"
            value={digitando}
            onChange={handleDigitar}
            placeholder="dd/mm/aaaa"
            maxLength={10}
            className="w-full mb-3 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-fuchsia-500 transition-all"
          />

          {/* VISTA DIAS */}
          {vista === 'dias' && (
            <>
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={() => navMes(-1)} className="p-1 text-fuchsia-400 hover:bg-gray-800 rounded-lg transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                </button>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setVista('meses')} className="text-white font-bold text-sm px-2 py-1 rounded hover:bg-gray-800 hover:text-fuchsia-400 transition-all">
                    {MESES[calMes]}
                  </button>
                  <button type="button" onClick={() => setVista('anos')} className="text-fuchsia-300 font-bold text-sm px-2 py-1 rounded hover:bg-gray-800 transition-all">
                    {calAno}
                  </button>
                </div>
                <button type="button" onClick={() => navMes(1)} className="p-1 text-fuchsia-400 hover:bg-gray-800 rounded-lg transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['D','S','T','Q','Q','S','S'].map((d, i) => (
                  <div key={i} className="text-center text-xs text-gray-500 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {gerarDias().map((d, i) => {
                  const sel = d === diaNum && calMes === mesNum && calAno === anoNum;
                  return (
                    <button
                      key={i} type="button"
                      disabled={!d}
                      onClick={() => d && selecionarDia(d)}
                      className={`text-center py-1 text-xs rounded transition-all
                        ${!d ? 'invisible' : sel
                          ? 'bg-fuchsia-600 text-white font-bold'
                          : 'text-white hover:bg-fuchsia-600/50'}`}
                    >
                      {d || ''}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* VISTA MESES */}
          {vista === 'meses' && (
            <>
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={() => setCalAno(a => a - 1)} className="p-1 text-fuchsia-400 hover:bg-gray-800 rounded-lg transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                </button>
                <button type="button" onClick={() => setVista('anos')} className="text-fuchsia-300 font-bold text-sm px-2 py-1 rounded hover:bg-gray-800 transition-all">
                  {calAno}
                </button>
                <button type="button" onClick={() => setCalAno(a => a + 1)} className="p-1 text-fuchsia-400 hover:bg-gray-800 rounded-lg transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {MESES_CURTOS.map((m, i) => (
                  <button key={i} type="button" onClick={() => { setCalMes(i); setVista('dias'); }}
                    className={`py-2 text-sm rounded-lg transition-all font-medium
                      ${i === calMes && calAno === anoNum ? 'bg-fuchsia-600 text-white' : 'text-white hover:bg-fuchsia-600/50'}`}>
                    {m}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setVista('dias')} className="mt-3 w-full text-xs text-gray-500 hover:text-fuchsia-400 transition-colors py-1">
                ← Voltar
              </button>
            </>
          )}

          {/* VISTA ANOS */}
          {vista === 'anos' && (
            <>
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={() => setAnoInicio(a => a - 12)} className="p-1 text-fuchsia-400 hover:bg-gray-800 rounded-lg transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                </button>
                <span className="text-white font-bold text-sm">{anoInicio} – {anoInicio + 11}</span>
                <button type="button" onClick={() => setAnoInicio(a => a + 12)} className="p-1 text-fuchsia-400 hover:bg-gray-800 rounded-lg transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {anos.map(a => (
                  <button key={a} type="button" onClick={() => { setCalAno(a); setAnoInicio(Math.floor(a/12)*12); setVista('meses'); }}
                    className={`py-2 text-sm rounded-lg transition-all font-medium
                      ${a === anoNum ? 'bg-fuchsia-600 text-white' : 'text-white hover:bg-fuchsia-600/50'}`}>
                    {a}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setVista('meses')} className="mt-3 w-full text-xs text-gray-500 hover:text-fuchsia-400 transition-colors py-1">
                ← Voltar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function DropdownPicker({
  value, onChange, label,
  placeholder = 'Selecione uma opção',
  options,
}: {
  value: string;
  onChange: (val: string) => void;
  label: string;
  placeholder?: string;
  options: { value: string; label: string }[];
}) {
  const [mostrar, setMostrar] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMostrar(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const sel = options.find(o => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2">{label}</label>
      <div onClick={() => setMostrar(v => !v)}
        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white cursor-pointer flex items-center justify-between hover:border-fuchsia-500 transition-all">
        <span className={value ? 'text-white' : 'text-gray-500'}>{sel?.label || placeholder}</span>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </div>
      {mostrar && (
        <div className={`absolute top-full mt-2 w-full bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-[9999] ${options.length > 4 ? 'max-h-48 overflow-y-auto' : ''}`}>
          {options.map(op => (
            <button key={op.value} type="button"
              onClick={() => { onChange(op.value); setMostrar(false); }}
              className={`w-full text-left px-4 py-3 transition-all first:rounded-t-xl last:rounded-b-xl
                ${value === op.value ? 'bg-fuchsia-600 text-white' : 'text-white hover:bg-fuchsia-600 hover:text-white'}`}>
              {op.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}