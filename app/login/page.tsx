import { loginAction } from "@/app/actions/auth";
import { LogoMark } from "@/components/Logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const error = (await searchParams).error === "1";

  return (
    // La page de connexion n'a pas de barre d'onglets : on annule la marge que le
    // layout lui réserve en bas.
    <div className="relative isolate -mb-[calc(var(--tabbar-height)+env(safe-area-inset-bottom))] flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12 lg:mb-0">
      {/* Coupe diagonale de la marque, en pleine page */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-wine-red [clip-path:polygon(0_82%,100%_34%,100%_100%,0_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-wine-deep [clip-path:polygon(0_100%,100%_62%,100%_100%)]"
      />

      <div data-enter className="card w-full max-w-sm p-8 shadow-[var(--shadow-lg)]">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <LogoMark size={64} className="rounded-[22%] shadow-[var(--shadow-md)]" />
          <div>
            <h1 className="text-title">Ma Cave</h1>
            <p className="mt-1 text-sm text-muted">Accès privé</p>
          </div>
        </div>

        <form action={loginAction} className="flex flex-col gap-3">
          <label htmlFor="password" className="label">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            name="password"
            required
            autoFocus
            autoComplete="current-password"
            aria-invalid={error || undefined}
            aria-describedby={error ? "password-error" : undefined}
            className="input"
          />
          {error && (
            <p id="password-error" role="alert" className="text-sm font-medium text-wine-red">
              Mot de passe incorrect.
            </p>
          )}
          <button type="submit" className="btn btn-primary btn-lg mt-2 w-full">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
