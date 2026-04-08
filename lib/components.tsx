// lib/components.tsx
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
  const [mes, setMes] = useState(new Date().getMonth());
  const [ano, setAno] = useState(new Date().getFullYear());
  const [anoInicio, setAnoInicio] = useState(Math.floor(new Date().getFullYear() / 12) * 12);
  const [digitando, setDigitando] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  const mesesCurtos = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMostrar(false);
        setVista('dias');
        setDigitando('');
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Inicializa o calendário com o valor atual ao abrir
  useEffect(() => {
    if (mostrar && value) {
      const [y, m] = value.split('-');
      setAno(parseInt(y));
      setMes(parseInt(m) - 1);
      setAnoInicio(Math.floor(parseInt(y) / 12) * 12);
    }
  }, [mostrar]);

  const gerarDias = () => {
    const primeiro = new Date(ano, mes, 1).getDay();
    const total = new Date(ano, mes + 1, 0).getDate();
    const dias: (number | null)[] = [];
    for (let i = 0; i < primeiro; i++) dias.push(null);
    for (let i = 1; i <= total; i++) dias.push(i);
    return dias;
  };

  const selecionarDia = (dia: number) => {
    const d = String(dia).padStart(2, '0');
    const m = String(mes + 1).padStart(2, '0');
    onChange(`${ano}-${m}-${d}`);
    setMostrar(false);
    setVista('dias');
    setDigitando('');
  };

  const selecionarMes = (m: number) => {
    setMes(m);
    setVista('dias');
  };

  const selecionarAno = (a: number) => {
    setAno(a);
    setAnoInicio(Math.floor(a / 12) * 12);
    setVista('meses');
  };

  const navegarMes = (d: number) => {
    let nm = mes + d, na = ano;
    if (nm < 0) { nm = 11; na--; }
    else if (nm > 11) { nm = 0; na++; }
    setMes(nm); setAno(na);
  };

  // Ao digitar, tenta parsear dd/mm/aaaa
  const handleDigitando = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d/]/g, '');
    // Auto-insere barras
    if (val.length === 2 && !val.includes('/')) val += '/';
    else if (val.length === 5 && val.split('/').length === 2) val += '/';
    setDigitando(val);

    const partes = val.split('/');
    if (partes.length === 3 && partes[2].length === 4) {
      const [dd, mm, yyyy] = partes.map(Number);
      if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12 && yyyy >= 1900 && yyyy <= 2100) {
        const dStr = String(dd).padStart(2, '0');
        const mStr = String(mm).padStart(2, '0');
        onChange(`${yyyy}-${mStr}-${dStr}`);
        setMes(mm - 1);
        setAno(yyyy);
        setAnoInicio(Math.floor(yyyy / 12) * 12);
      }
    }
  };

  const [anoVal, mesVal, diaVal] = value ? value.split('-') : ['', '', ''];
  const dataFormatada = value
    ? `${diaVal}/${mesVal}/${anoVal}`
    : placeholder;

  const diaSelecionado = value ? parseInt(diaVal) : null;
  const mesSelecionado = value ? parseInt(mesVal) - 1 : null;
  const anoSelecionado = value ? parseInt(anoVal) : null;

  const anos = Array.from({ length: 12 }, (_, i) => anoInicio + i);

  return (
    <div className="relative" ref={containerRef}>
      <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2">{label}</label>
      <div
        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white cursor-pointer flex items-center justify-between hover:border-fuchsia-500 transition-all"
        onClick={() => { setMostrar(!mostrar); setVista('dias'); }}
      >
        <span className={value ? 'text-white' : 'text-gray-500'}>{dataFormatada}</span>
        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      {mostrar && (
        <div className="absolute top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-4">

          {/* Campo de digitação */}
          <div className="mb-3">
            <input
              type="text"
              value={digitando}
              onChange={handleDigitando}
              placeholder="dd/mm/aaaa"
              maxLength={10}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-fuchsia-500 transition-all"
            />
          </div>

          {/* VISTA: DIAS */}
          {vista === 'dias' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => navegarMes(-1)}
                  className="text-fuchsia-400 hover:text-fuchsia-300 p-1.5 hover:bg-gray-800 rounded-lg transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={() => setVista('meses')}
                  className="text-white font-bold text-sm hover:text-fuchsia-400 transition-colors px-2 py-1 rounded-lg hover:bg-gray-800"
                >
                  {mesesNomes[mes]}
                </button>

                <button
                  onClick={() => setVista('anos')}
                  className="text-fuchsia-300 font-bold text-sm hover:text-fuchsia-200 transition-colors px-2 py-1 rounded-lg hover:bg-gray-800"
                >
                  {ano}
                </button>

                <button onClick={() => navegarMes(1)}
                  className="text-fuchsia-400 hover:text-fuchsia-300 p-1.5 hover:bg-gray-800 rounded-lg transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                  <div key={i} className="text-center text-xs text-gray-500 font-bold py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {gerarDias().map((diaNum, i) => {
                  const selecionado = diaNum === diaSelecionado && mes === mesSelecionado && ano === anoSelecionado;
                  return (
                    <button key={i} disabled={!diaNum}
                      onClick={() => diaNum && selecionarDia(diaNum)}
                      className={`text-center py-1.5 text-xs rounded-lg transition-all
                        ${!diaNum ? 'invisible' : ''}
                        ${selecionado
                          ? 'bg-fuchsia-600 text-white font-bold'
                          : diaNum ? 'text-white hover:bg-fuchsia-600/50 hover:text-white' : ''
                        }`}
                    >
                      {diaNum || ''}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* VISTA: MESES */}
          {vista === 'meses' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setAno(a => a - 1)}
                  className="text-fuchsia-400 hover:text-fuchsia-300 p-1.5 hover:bg-gray-800 rounded-lg transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button onClick={() => setVista('anos')}
                  className="text-fuchsia-300 font-bold text-sm hover:text-fuchsia-200 px-2 py-1 rounded-lg hover:bg-gray-800 transition-all">
                  {ano}
                </button>
                <button onClick={() => setAno(a => a + 1)}
                  className="text-fuchsia-400 hover:text-fuchsia-300 p-1.5 hover:bg-gray-800 rounded-lg transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {mesesCurtos.map((m, i) => (
                  <button key={i} onClick={() => selecionarMes(i)}
                    className={`py-2 text-sm rounded-lg transition-all font-medium
                      ${i === mes && ano === anoSelecionado
                        ? 'bg-fuchsia-600 text-white'
                        : 'text-white hover:bg-fuchsia-600/50'
                      }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <button onClick={() => setVista('dias')}
                className="mt-3 w-full text-xs text-gray-500 hover:text-fuchsia-400 transition-colors py-1">
                ← Voltar para dias
              </button>
            </>
          )}

          {/* VISTA: ANOS */}
          {vista === 'anos' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setAnoInicio(a => a - 12)}
                  className="text-fuchsia-400 hover:text-fuchsia-300 p-1.5 hover:bg-gray-800 rounded-lg transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-white font-bold text-sm">{anoInicio} – {anoInicio + 11}</span>
                <button onClick={() => setAnoInicio(a => a + 12)}
                  className="text-fuchsia-400 hover:text-fuchsia-300 p-1.5 hover:bg-gray-800 rounded-lg transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {anos.map(a => (
                  <button key={a} onClick={() => selecionarAno(a)}
                    className={`py-2 text-sm rounded-lg transition-all font-medium
                      ${a === anoSelecionado
                        ? 'bg-fuchsia-600 text-white'
                        : 'text-white hover:bg-fuchsia-600/50'
                      }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <button onClick={() => setVista('meses')}
                className="mt-3 w-full text-xs text-gray-500 hover:text-fuchsia-400 transition-colors py-1">
                ← Voltar para meses
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Componente de Dropdown Customizado (mantém igual)
export function DropdownPicker({
  value,
  onChange,
  label,
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setMostrar(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const selecionado = options.find(o => o.value === value);

  return (
    <div className="relative" ref={containerRef}>
      <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2">{label}</label>
      <div
        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white cursor-pointer flex items-center justify-between hover:border-fuchsia-500 transition-all"
        onClick={() => setMostrar(!mostrar)}
      >
        <span className={value ? 'text-white' : 'text-gray-500'}>{selecionado?.label || placeholder}</span>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {mostrar && (
        <div className={`absolute top-full mt-2 w-full bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 ${options.length > 4 ? 'max-h-48 overflow-y-auto' : ''}`}>
          {options.map(op => (
            <button key={op.value} onClick={() => { onChange(op.value); setMostrar(false); }}
              className={`w-full text-left px-4 py-3 transition-all first:rounded-t-xl last:rounded-b-xl
                ${value === op.value ? 'bg-fuchsia-600 text-white' : 'text-white hover:bg-fuchsia-600 hover:text-white'}`}
            >
              {op.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}