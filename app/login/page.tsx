"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage(){
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string|undefined>(undefined);

  async function handleSubmit(e: React.FormEvent){
    e.preventDefault();
    setError(undefined);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined
      }
    });
    if(error){ setError(error.message); return; }
    setSent(true);
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-6">
      <h1 className="text-xl font-semibold mb-2">Entrar</h1>
      <p className="text-sm text-slate-600 mb-4">Informe seu e‑mail para receber um link de acesso.</p>
      {sent ? (
        <div className="text-green-700">Link enviado! Verifique sua caixa de entrada.</div>
      ):(
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full border rounded-lg px-3 py-2"
          />
          <button className="w-full bg-slate-900 text-white rounded-lg py-2">Enviar link</button>
          {error && <div className="text-red-600 text-sm">{error}</div>}
        </form>
      )}
    </div>
  );
}
