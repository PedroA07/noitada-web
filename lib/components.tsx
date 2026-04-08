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
  const [abrirParaCima, setAbrirParaCima] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

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

  const abrirCalendario = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setAbrirParaCima(window.innerHeight - rect.bottom < 400);
    }
    if (value) {
      const [y, m] = value.split('-');
      if (y && m) {
        setCalAno(parseInt(y));
        setCalMes(parseInt(m) - 1);
        setAnoInicio(Math.floor(parseInt(y) / 12) * 12);
      }
    }
    setMostrar(v => !v);
    setVista('dias');
  };

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

  // Estilos inline para garantir que funcionem mesmo sem Tailwind JIT
  const gridSemanas: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px',
  };
  const gridMeses: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
  };

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: '8px' }}>
        {label}
      </label>

      <div
        ref={triggerRef}
        onClick={abrirCalendario}
        style={{
          width: '100%',
          background: '#030712',
          border: '1px solid #374151',
          borderRadius: '12px',
          padding: '12px 16px',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ color: value ? 'white' : '#6b7280' }}>{exibir}</span>
        <svg width="20" height="20" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>

      {mostrar && (
        <div style={{
          position: 'absolute',
          left: 0,
          [abrirParaCima ? 'bottom' : 'top']: 'calc(100% + 8px)',
          width: '280px',
          background: '#111827',
          border: '1px solid #374151',
          borderRadius: '12px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
          padding: '16px',
          zIndex: 99999,
        }}>

          {/* Campo de digitação */}
          <input
            type="text"
            value={digitando}
            onChange={handleDigitar}
            placeholder="dd/mm/aaaa"
            maxLength={10}
            style={{
              width: '100%',
              marginBottom: '12px',
              background: '#1f2937',
              border: '1px solid #4b5563',
              borderRadius: '8px',
              padding: '8px 12px',
              color: 'white',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          {/* ── VISTA DIAS ── */}
          {vista === 'dias' && (
            <>
              {/* Cabeçalho mês/ano */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <button type="button" onClick={() => navMes(-1)} style={{ background: 'none', border: 'none', color: '#c084fc', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button type="button" onClick={() => setVista('meses')} style={{ background: 'none', border: 'none', color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#c084fc')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'white')}>
                    {MESES[calMes]}
                  </button>
                  <button type="button" onClick={() => setVista('anos')} style={{ background: 'none', border: 'none', color: '#d8b4fe', fontWeight: 700, fontSize: '14px', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#c084fc')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#d8b4fe')}>
                    {calAno}
                  </button>
                </div>

                <button type="button" onClick={() => navMes(1)} style={{ background: 'none', border: 'none', color: '#c084fc', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>

              {/* Dias da semana */}
              <div style={gridSemanas}>
                {['D','S','T','Q','Q','S','S'].map((d, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: '11px', color: '#6b7280', fontWeight: 700, padding: '4px 0' }}>{d}</div>
                ))}
              </div>

              {/* Dias do mês */}
              <div style={gridSemanas}>
                {gerarDias().map((d, i) => {
                  const sel = d === diaNum && calMes === mesNum && calAno === anoNum;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={!d}
                      onClick={() => d && selecionarDia(d)}
                      style={{
                        textAlign: 'center',
                        padding: '6px 2px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: d ? 'pointer' : 'default',
                        background: sel ? '#9333ea' : 'transparent',
                        color: !d ? 'transparent' : sel ? 'white' : '#e5e7eb',
                        fontWeight: sel ? 700 : 400,
                        visibility: d ? 'visible' : 'hidden',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (d && !sel) e.currentTarget.style.background = 'rgba(147,51,234,0.4)'; }}
                      onMouseLeave={e => { if (d && !sel) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {d || ''}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ── VISTA MESES ── */}
          {vista === 'meses' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <button type="button" onClick={() => setCalAno(a => a - 1)} style={{ background: 'none', border: 'none', color: '#c084fc', cursor: 'pointer', padding: '4px' }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                <button type="button" onClick={() => setVista('anos')} style={{ background: 'none', border: 'none', color: '#d8b4fe', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                  {calAno}
                </button>
                <button type="button" onClick={() => setCalAno(a => a + 1)} style={{ background: 'none', border: 'none', color: '#c084fc', cursor: 'pointer', padding: '4px' }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>

              <div style={gridMeses}>
                {MESES_CURTOS.map((m, i) => {
                  const sel = i === calMes && calAno === anoNum;
                  return (
                    <button key={i} type="button"
                      onClick={() => { setCalMes(i); setVista('dias'); }}
                      style={{
                        padding: '10px 4px',
                        fontSize: '13px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        background: sel ? '#9333ea' : 'transparent',
                        color: sel ? 'white' : '#e5e7eb',
                        fontWeight: sel ? 700 : 500,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'rgba(147,51,234,0.4)'; }}
                      onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}>
                      {m}
                    </button>
                  );
                })}
              </div>

              <button type="button" onClick={() => setVista('dias')}
                style={{ marginTop: '12px', width: '100%', background: 'none', border: 'none', color: '#6b7280', fontSize: '12px', cursor: 'pointer' }}>
                ← Voltar
              </button>
            </>
          )}

          {/* ── VISTA ANOS ── */}
          {vista === 'anos' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <button type="button" onClick={() => setAnoInicio(a => a - 12)} style={{ background: 'none', border: 'none', color: '#c084fc', cursor: 'pointer', padding: '4px' }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>{anoInicio} – {anoInicio + 11}</span>
                <button type="button" onClick={() => setAnoInicio(a => a + 12)} style={{ background: 'none', border: 'none', color: '#c084fc', cursor: 'pointer', padding: '4px' }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>

              <div style={gridMeses}>
                {anos.map(a => {
                  const sel = a === anoNum;
                  return (
                    <button key={a} type="button"
                      onClick={() => { setCalAno(a); setAnoInicio(Math.floor(a / 12) * 12); setVista('meses'); }}
                      style={{
                        padding: '10px 4px',
                        fontSize: '13px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        background: sel ? '#9333ea' : 'transparent',
                        color: sel ? 'white' : '#e5e7eb',
                        fontWeight: sel ? 700 : 500,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'rgba(147,51,234,0.4)'; }}
                      onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}>
                      {a}
                    </button>
                  );
                })}
              </div>

              <button type="button" onClick={() => setVista('meses')}
                style={{ marginTop: '12px', width: '100%', background: 'none', border: 'none', color: '#6b7280', fontSize: '12px', cursor: 'pointer' }}>
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
    <div style={{ position: 'relative' }} ref={ref}>
      <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: '8px' }}>
        {label}
      </label>
      <div
        onClick={() => setMostrar(v => !v)}
        style={{
          width: '100%',
          background: '#030712',
          border: '1px solid #374151',
          borderRadius: '12px',
          padding: '12px 16px',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
        }}
      >
        <span style={{ color: value ? 'white' : '#6b7280' }}>{sel?.label || placeholder}</span>
        <svg width="20" height="20" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </div>
      {mostrar && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          width: '100%',
          background: '#111827',
          border: '1px solid #374151',
          borderRadius: '12px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
          overflow: 'hidden',
          zIndex: 99999,
        }}>
          {options.map(op => (
            <button
              key={op.value}
              type="button"
              onClick={() => { onChange(op.value); setMostrar(false); }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px',
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                background: value === op.value ? '#9333ea' : 'transparent',
                color: 'white',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (value !== op.value) e.currentTarget.style.background = '#9333ea'; }}
              onMouseLeave={e => { if (value !== op.value) e.currentTarget.style.background = 'transparent'; }}
            >
              {op.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}