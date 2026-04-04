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
      <div className="relative z-20 w-full max-w-md bg-gray-900/80 border border-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
        <h1 className="text-3xl font-black text-center text-fuchsia-400 tracking-widest uppercase mb-2">NOITADA</h1>
        <p className="text-gray-400 text-center text-sm mb-8">Crie sua conta</p>

        <form className="space-y-6">
          <input
            type="email"
            placeholder="seu@email.com"
            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all"
            required
          />
          <input
            type="password"
            placeholder="Confirmar Senha"
            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all"
            required
          />
          <div className="flex justify-center">
            <div className="g-recaptcha" data-sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}></div>
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-black rounded-xl transition-all uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(168,85,247,0.4)] active:scale-95 py-3"
          >
            Criar Conta
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">Já tem conta?</p>
          <Link href="/login" className="text-fuchsia-400 hover:text-fuchsia-300 font-bold">
            Faça login
          </Link>
        </div>
      </div>
    </main>
  );
}
