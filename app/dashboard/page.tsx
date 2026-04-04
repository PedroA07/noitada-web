import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gray-900/80 border border-white/10 rounded-3xl p-8">
        <h1 className="text-3xl font-black text-fuchsia-400 mb-4">Dashboard</h1>
        <p className="text-gray-400">O dashboard ainda não foi implementado nesta versão.</p>
        <Link href="/" className="mt-6 inline-flex items-center gap-2 text-fuchsia-400 hover:text-fuchsia-300">
          Voltar para a home
        </Link>
      </div>
    </main>
  );
}
