import Link from 'next/link';

export default function CadastroPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      <video
        autoPlay
        loop
        muted
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="/videos/background.mp4"
      />
      <div className="absolute inset-0 bg-black/50 z-10" />
      <div className="absolute top-4 left-4 z-20">
        <img src="/images/logo.png" alt="NOITADA Logo" className="h-12 w-auto" />
      </div>
      <div className="relative z-20 max-w-xl w-full bg-gray-900/80 border border-white/10 rounded-3xl p-8">
        <h1 className="text-3xl font-black text-fuchsia-400 mb-4">Cadastro</h1>
        <p className="text-gray-400">A página de cadastro ainda não está implementada aqui.</p>
        <p className="text-sm text-gray-500 mt-4">O endpoint de cadastro já foi corrigido, mas falta criar a interface de formulário.</p>
        <Link href="/" className="mt-6 inline-flex items-center gap-2 text-fuchsia-400 hover:text-fuchsia-300">
          Voltar para a home
        </Link>
      </div>
    </main>
  );
}
