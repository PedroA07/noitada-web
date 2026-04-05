import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-transparent text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-purple-950/40 border border-purple-400/20 rounded-[32px] p-8 backdrop-blur-xl shadow-[0_20px_80px_rgba(109,40,217,0.35)]">
        <h1 className="text-3xl font-black text-fuchsia-400 mb-4">Dashboard</h1>
        <p className="text-gray-300">O dashboard ainda não foi implementado nesta versão.</p>
        <Link href="/" className="mt-6 inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors">
          Voltar para a home
        </Link>
      </div>
    </main>
  );
}
