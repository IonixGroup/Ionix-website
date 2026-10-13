import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="flex flex-col items-center gap-3 mb-8">
            <span className="h-px w-16 bg-hair" />
            <span className="font-serif font-medium text-4xl tracking-[0.04em]">IONIX</span>
            <span className="flex items-center gap-3">
              <span className="h-px w-10 bg-hair" />
              <span className="w-1 h-1 rounded-full bg-terra" />
              <span className="h-px w-10 bg-hair" />
            </span>
            <span className="font-serif text-sm tracking-[0.22em] uppercase text-terra">
              Group
            </span>
            <span className="h-px w-16 bg-hair" />
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
