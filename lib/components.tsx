"use client";

import { useState, useEffect, useRef, ReactNode } from 'react';

// Componente de Calendário Customizado
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
  const [mes, setMes] = useState(new Date().getMonth());
  const [ano, setAno] = useState(new Date().getFullYear());
  const containerRef = useRef<HTMLDivElement>(null);

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMostrar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const gerarDias = () => {
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaSemanaInicio = primeiroDia.getDay();

    const dias = [];
    for (let i = 0; i < diaSemanaInicio; i++) dias.push(null);
    for (let i = 1; i <= diasNoMes; i++) dias.push(i);
    return dias;
  };

  const navegarMes = (direcao: number) => {
    let novoMes = mes + direcao;
    let novoAno = ano;
    if (novoMes < 0) {
      novoMes = 11;
      novoAno--;
    } else if (novoMes > 11) {
      novoMes = 0;
      novoAno++;
    }
    setMes(novoMes);
    setAno(novoAno);
  };

  const selecionarData = (dia: number) => {
    const diaStr = String(dia).padStart(2, '0');
    const mesStr = String(mes + 1).padStart(2, '0');
    onChange(`${ano}-${mesStr}-${diaStr}`);
    setMostrar(false);
  };

  const [dia, mesExib, anoExib] = value ? value.split('-') : ['', '', ''];
  const dataFormatada = value ? `${dia}/${mesExib}/${anoExib}` : placeholder;

  return (
    <div className="relative calendar-container" ref={containerRef}>
      <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2">{label}</label>
      <div
        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white cursor-pointer focus:outline-none focus:border-fuchsia-500 transition-all flex items-center justify-between"
        onClick={() => setMostrar(!mostrar)}
      >
        <span className={value ? 'text-white' : 'text-gray-500'}>{dataFormatada}</span>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      {mostrar && (
        <div className="absolute top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navegarMes(-1)}
              className="text-fuchsia-400 hover:text-fuchsia-300 p-2 hover:bg-gray-800 rounded-lg transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-white font-bold text-lg">{mesesNomes[mes]} {ano}</span>
            <button
              onClick={() => navegarMes(1)}
              className="text-fuchsia-400 hover:text-fuchsia-300 p-2 hover:bg-gray-800 rounded-lg transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="text-center text-sm text-gray-400 font-bold py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {gerarDias().map((diaNum, index) => (
              <button
                key={index}
                onClick={() => diaNum && selecionarData(diaNum)}
                disabled={!diaNum}
                className={`text-center py-3 px-2 text-sm rounded-lg transition-all ${
                  diaNum
                    ? 'text-white hover:bg-fuchsia-600 hover:text-white hover:scale-105'
                    : ''
                } ${
                  diaNum === parseInt(dia) && mes === parseInt(mesExib) - 1 && ano === parseInt(anoExib)
                    ? 'bg-fuchsia-600 text-white scale-105'
                    : 'text-gray-400'
                }`}
              >
                {diaNum || ''}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de Dropdown Customizado
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
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMostrar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selecionado = options.find(o => o.value === value);

  return (
    <div className="relative dropdown-container" ref={containerRef}>
      <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2">{label}</label>
      <div
        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white cursor-pointer focus:outline-none focus:border-fuchsia-500 transition-all flex items-center justify-between"
        onClick={() => setMostrar(!mostrar)}
      >
        <span className={value ? 'text-white' : 'text-gray-500'}>
          {selecionado?.label || placeholder}
        </span>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {mostrar && (
        <div className="absolute top-full mt-2 w-full bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
          {options.map(op => (
            <button
              key={op.value}
              onClick={() => {
                onChange(op.value);
                setMostrar(false);
              }}
              className={`w-full text-left px-4 py-3 transition-all first:rounded-t-xl last:rounded-b-xl ${
                value === op.value
                  ? 'bg-fuchsia-600 text-white'
                  : 'text-white hover:bg-fuchsia-600 hover:text-white'
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
