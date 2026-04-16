// Re-exporta a rota de moderação (sem acento no caminho, para compatibilidade com URLs)
export { POST } from '../moderação/route';
export const dynamic = 'force-dynamic';
