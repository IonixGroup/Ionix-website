import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="flex items-baseline justify-center gap-2 mb-6">
            <span className="font-serif font-medium text-xl tracking-[0.1em]">IONIX</span>
            <span className="font-mono text-[8px] tracking-[0.22em] uppercase text-terra">
              Group
            </span>
          </div>
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-3 mb-2">
            Accesso
          </div>
          <h1 className="font-serif text-2xl -tracking-[0.01em]">Entra nel tuo account</h1>
        </div>

        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
