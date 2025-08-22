"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewForm(){
  const [nome, setNome] = useState("");
  const [uf, setUf] = useState("GO");
  const [dataBase, setDataBase] = useState("");
  const [bdi, setBdi] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent){
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/orcamentos",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ nome, uf, data_base: dataBase || null, bdi })
    });
    setLoading(false);
    if(res.ok){
      const { id } = await res.json();
      router.replace(`/orcamentos/${id}`);
    }else{
      alert("Erro ao criar orçamento");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow max-w-lg">
      <h1 className="text-xl font-semibold mb-4">Novo Orçamento</h1>
      <div className="grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm">Nome</span>
          <input className="border rounded-lg px-3 py-2" value={nome} onChange={e=>setNome(e.target.value)} required/>
        </label>
        <label className="grid gap-1">
          <span className="text-sm">UF</span>
          <input className="border rounded-lg px-3 py-2" value={uf} onChange={e=>setUf(e.target.value.toUpperCase())} maxLength={2} required/>
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Data-base (AAAA-MM)</span>
          <input className="border rounded-lg px-3 py-2" type="month" value={dataBase} onChange={e=>setDataBase(e.target.value)}/>
        </label>
        <label className="grid gap-1">
          <span className="text-sm">BDI (%)</span>
          <input className="border rounded-lg px-3 py-2" type="number" step="0.01" value={bdi} onChange={e=>setBdi(parseFloat(e.target.value))}/>
        </label>
        <button disabled={loading} className="bg-slate-900 text-white rounded-lg py-2">{loading? "Criando..." : "Criar orçamento"}</button>
      </div>
    </form>
  );
}
