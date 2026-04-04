import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-6xl font-black text-fuchsia-500 mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-8">Página não encontrada</h2>
      <p className="text-gray-400 mb-8 text-center max-w-md">
        A página que você está procurando não existe ou foi movida.
      </p>
      <Link href="/" className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-3 px-8 rounded-lg transition-all">
        Voltar para o Início
      </Link>
    </div>
  );
}