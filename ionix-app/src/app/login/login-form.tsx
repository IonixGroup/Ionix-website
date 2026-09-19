"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setLoading(false);
      setError("Email o password non corrette.");
      return;
    }

    router.push(searchParams.get("next") || "/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-2">
          Email
        </label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-b border-hair bg-transparent px-1 py-2 text-sm outline-none focus:border-terra"
          placeholder="nome@ionixgroup.it"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-2">
          Password
        </label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-b border-hair bg-transparent px-1 py-2 text-sm outline-none focus:border-terra"
        />
      </div>

      {error && <p className="text-terra-dark text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 flex items-center justify-center gap-3 bg-ink text-paper py-4 font-mono text-[11px] tracking-[0.16em] uppercase disabled:opacity-60"
      >
        {loading ? "Accesso…" : "Accedi"}
      </button>
    </form>
  );
}
