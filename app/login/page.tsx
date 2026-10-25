import { loginAction } from "@/app/actions/auth";
import Image from "next/image";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const error = (await searchParams).error === "1";

  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: 'calc(100vh - 64px)' }}
    >
      <div
        data-enter
        className="w-full max-w-sm mx-4 p-8 rounded-2xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(26,10,14,0.08)',
        }}
      >
        <div className="flex flex-col items-center gap-3 mb-8">
          <Image
            src="/icons/logo-mark.png"
            alt=""
            width={48}
            height={48}
            className="w-12 h-12 rounded-xl"
            priority
          />
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-playfair)', color: 'var(--foreground)' }}
          >
            Ma Cave
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Accès privé
          </p>
        </div>

        <form action={loginAction} className="flex flex-col gap-4">
          <input
            type="password"
            name="password"
            placeholder="Mot de passe"
            required
            autoFocus
            className="w-full px-4 py-3 rounded-lg text-sm outline-none"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            }}
          />
          {error && (
            <p className="text-sm text-center" style={{ color: 'var(--wine-red)' }}>
              Mot de passe incorrect
            </p>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--wine-red)', fontFamily: 'var(--font-inter)' }}
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  )
}
