"use client";

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

const CATEGORIAS = ['anime', 'serie', 'filme', 'desenho', 'jogo', 'musica', 'outro'];
const RARIDADES = ['comum', 'incomum', 'raro', 'epico', 'lendario'];

const COR_RARIDADE: Record<string, string> = {
  comum: 'border-gray-400 bg-gray-400/10',
  incomum: 'border-green-400 bg-green-400/10',
  raro: 'border-blue-400 bg-blue-400/10',
  epico: 'border-purple-400 bg-purple-400/10',
  lendario: 'border-yellow-400 bg-yellow-400/10',
};

const EMOJI_RARIDADE: Record<string, string> = {
  comum: '⚪', incomum: '🟢', raro: '🔵', epico: '🟣', lendario: '🟡',
};

type Carta = {
  id: string;
  nome: string;
  personagem: string;
  vinculo: string;
  categoria: string;
  raridade: string;
  imagem_url: string | null;
  imagem_r2_key: string | null;
  descricao: string | null;
  ativa: boolean;
  criado_por: string;
};

const VAZIA: Omit<Carta, 'id' | 'ativa' | 'criado_por' | 'imagem_r2_key'> = {
  nome: '', personagem: '', vinculo: '',
  categoria: 'anime', raridade: 'comum',
  imagem_url: null, descricao: null,
};

export default function CartasPage() {
  const [cartas, setCartas] = useState<Carta[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Carta | null>(null);
  const [form, setForm] = useState(VAZIA);
  const [arquivoImagem, setArquivoImagem] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState<string | null>(null);
  const [modoImagem, setModoImagem] = useState<'url' | 'upload'>('url');
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState('');
  const inputFileRef = useRef<HTMLInputElement>(null);

  const buscarCartas = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      pagina: String(pagina),
      ...(busca && { busca }),
      ...(filtroCategoria && { categoria: filtroCategoria }),
    });

    const res = await fetch(`/api/cartas?${params}`);
    if (res.ok) {
      const dados = await res.json();
      setCartas(dados.cartas || []);
      setTotal(dados.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => { buscarCartas(); }, [pagina, filtroCategoria]);

  useEffect(() => {
    const t = setTimeout(() => { if (pagina === 1) buscarCartas(); else setPagina(1); }, 400);
    return () => clearTimeout(t);
  }, [busca]);

  const abrirModal = (carta?: Carta) => {
    if (carta) {
      setEditando(carta);
      setForm({
        nome: carta.nome, personagem: carta.personagem, vinculo: carta.vinculo,
        categoria: carta.categoria, raridade: carta.raridade,
        imagem_url: carta.imagem_url, descricao: carta.descricao,
      });
      setPreviewImagem(carta.imagem_url);
      setModoImagem(carta.imagem_r2_key ? 'upload' : 'url');
    } else {
      setEditando(null);
      setForm(VAZIA);
      setPreviewImagem(null);
      setModoImagem('url');
    }
    setArquivoImagem(null);
    setMsg('');
    setModal(true);
  };

  const fecharModal = () => { setModal(false); setEditando(null); };

  const handleArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArquivoImagem(file);
    setPreviewImagem(URL.createObjectURL(file));
  };

  const salvar = async () => {
    if (!form.nome || !form.personagem || !form.vinculo || !form.categoria || !form.raridade) {
      setMsg('❌ Preencha todos os campos obrigatórios.');
      return;
    }

    setSalvando(true);
    setMsg('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setMsg('❌ Sessão expirada.'); return; }

      let imagemUrl = form.imagem_url;
      let imagemR2Key = editando?.imagem_r2_key || null;

      // Upload para R2 se houver arquivo
      if (modoImagem === 'upload' && arquivoImagem) {
        const fd = new FormData();
        fd.append('imagem', arquivoImagem);
        if (editando?.id) fd.append('cartaId', editando.id);
        if (editando?.imagem_r2_key) fd.append('chaveAntiga', editando.imagem_r2_key);

        const uploadRes = await fetch('/api/cartas/upload', { method: 'POST', body: fd });
        if (!uploadRes.ok) throw new Error('Falha no upload da imagem');
        const uploadData = await uploadRes.json();
        imagemUrl = uploadData.url;
        imagemR2Key = uploadData.chave;
      }

      const payload = {
        ...form,
        imagem_url: imagemUrl,
        imagem_r2_key: imagemR2Key,
        criado_por: session.user.id,
      };

      const method = editando ? 'PATCH' : 'POST';
      const body = editando ? { id: editando.id, ...payload } : payload;

      const res = await fetch('/api/cartas', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Erro ao salvar carta');

      setMsg('✅ Carta salva com sucesso!');
      await buscarCartas();
      setTimeout(fecharModal, 1000);
    } catch (error: any) {
      setMsg(`❌ ${error.message}`);
    } finally {
      setSalvando(false);
    }
  };

  const desativar = async (id: string) => {
    if (!confirm('Desativar esta carta?')) return;
    await fetch(`/api/cartas?id=${id}`, { method: 'DELETE' });
    await buscarCartas();
  };

  const totalPaginas = Math.ceil(total / 20);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="border-b border-white/10 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
            Coleção de <span className="text-fuchsia-400">Cartas</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">{total} carta(s) cadastrada(s)</p>
        </div>
        <button
          onClick={() => abrirModal()}
          className="px-6 py-3 bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-black rounded-xl uppercase text-sm tracking-widest transition-all"
        >
          + Nova Carta
        </button>
      </header>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="🔍 Buscar por nome, personagem ou vínculo..."
          className="flex-1 min-w-60 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-fuchsia-500 outline-none"
        />
        <select
          value={filtroCategoria}
          onChange={e => { setFiltroCategoria(e.target.value); setPagina(1); }}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-fuchsia-500 outline-none"
        >
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Grid de cartas */}
      {loading ? (
        <div className="text-center py-20 text-fuchsia-400 font-black animate-pulse">Carregando...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {cartas.map(carta => (
            <div
              key={carta.id}
              className={`relative border-2 rounded-2xl overflow-hidden bg-black/40 transition-all hover:scale-105 ${COR_RARIDADE[carta.raridade]}`}
            >
              <div className="relative w-full aspect-[3/4] bg-gray-900">
                {carta.imagem_url ? (
                  <Image src={carta.imagem_url} alt={carta.nome} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🃏</div>
                )}
                <div className="absolute top-2 right-2 text-lg">{EMOJI_RARIDADE[carta.raridade]}</div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                  <p className="text-white font-black text-xs uppercase truncate">{carta.personagem}</p>
                  <p className="text-gray-400 text-xs truncate">{carta.vinculo}</p>
                </div>
              </div>
              <div className="p-2 flex gap-1">
                <button
                  onClick={() => abrirModal(carta)}
                  className="flex-1 py-1 text-xs font-black bg-white/10 hover:bg-fuchsia-500/30 text-white rounded-lg transition-all"
                >
                  Editar
                </button>
                <button
                  onClick={() => desativar(carta.id)}
                  className="flex-1 py-1 text-xs font-black bg-white/10 hover:bg-red-500/30 text-red-400 rounded-lg transition-all"
                >
                  Desativar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex justify-center items-center gap-4">
          <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
            className="text-xs font-black uppercase text-gray-500 hover:text-white disabled:text-gray-700 transition-colors">
            Anterior
          </button>
          <span className="text-fuchsia-400 font-black text-xs bg-white/5 px-4 py-2 rounded-xl border border-fuchsia-500/20">
            {pagina} / {totalPaginas}
          </span>
          <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
            className="text-xs font-black uppercase text-gray-500 hover:text-white disabled:text-gray-700 transition-colors">
            Próxima
          </button>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={fecharModal} />
          <div className="relative bg-gray-900 border border-white/10 rounded-3xl w-full max-w-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white">{editando ? 'Editar Carta' : 'Nova Carta'}</h2>
              <button onClick={fecharModal} className="text-gray-500 hover:text-red-400 text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-black uppercase tracking-widest block mb-1">Nome da Carta *</label>
                  <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-fuchsia-500 outline-none"
                    placeholder="Ex: Naruto Uzumaki" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-black uppercase tracking-widest block mb-1">Personagem / Item *</label>
                  <input value={form.personagem} onChange={e => setForm(f => ({ ...f, personagem: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-fuchsia-500 outline-none"
                    placeholder="Ex: Naruto" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-black uppercase tracking-widest block mb-1">Vínculo *</label>
                <input value={form.vinculo} onChange={e => setForm(f => ({ ...f, vinculo: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-fuchsia-500 outline-none"
                  placeholder="Ex: Naruto Shippuden" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-black uppercase tracking-widest block mb-1">Categoria *</label>
                  <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-fuchsia-500 outline-none appearance-none">
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-black uppercase tracking-widest block mb-1">Raridade *</label>
                  <select value={form.raridade} onChange={e => setForm(f => ({ ...f, raridade: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-fuchsia-500 outline-none appearance-none">
                    {RARIDADES.map(r => (
                      <option key={r} value={r}>{EMOJI_RARIDADE[r]} {r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-black uppercase tracking-widest block mb-1">Descrição</label>
                <textarea value={form.descricao || ''} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  rows={2}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-fuchsia-500 outline-none resize-none"
                  placeholder="Descrição opcional da carta..." />
              </div>

              {/* Imagem */}
              <div>
                <label className="text-xs text-gray-400 font-black uppercase tracking-widest block mb-2">Imagem</label>
                <div className="flex gap-2 mb-3">
                  {(['url', 'upload'] as const).map(modo => (
                    <button key={modo} onClick={() => setModoImagem(modo)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                        modoImagem === modo
                          ? 'bg-fuchsia-500 text-white border-fuchsia-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }`}>
                      {modo === 'url' ? '🔗 URL' : '📁 Upload'}
                    </button>
                  ))}
                </div>

                {modoImagem === 'url' ? (
                  <input
                    value={form.imagem_url || ''}
                    onChange={e => { setForm(f => ({ ...f, imagem_url: e.target.value })); setPreviewImagem(e.target.value); }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-fuchsia-500 outline-none"
                    placeholder="https://..." />
                ) : (
                  <div>
                    <input ref={inputFileRef} type="file" accept="image/*" onChange={handleArquivo} className="hidden" />
                    <button onClick={() => inputFileRef.current?.click()}
                      className="w-full py-4 border-2 border-dashed border-white/20 hover:border-fuchsia-500/50 rounded-xl text-gray-400 hover:text-white text-sm font-black transition-all">
                      {arquivoImagem ? `📁 ${arquivoImagem.name}` : '📁 Clique para selecionar imagem'}
                    </button>
                  </div>
                )}

                {previewImagem && (
                  <div className="mt-3 relative w-32 h-44 rounded-xl overflow-hidden border-2 border-white/10">
                    <Image src={previewImagem} alt="Preview" fill className="object-cover" />
                  </div>
                )}
              </div>

              {msg && <p className="text-sm font-bold">{msg}</p>}

              <button onClick={salvar} disabled={salvando}
                className="w-full py-4 bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-black rounded-xl uppercase tracking-widest text-sm transition-all disabled:opacity-50">
                {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Criar Carta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}