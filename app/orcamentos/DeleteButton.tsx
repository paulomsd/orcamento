"use client";
export default function DeleteOrcamentoButton({ id }: { id: string }) {
  return (
    <form
      action="/api/orcamentos"
      method="POST"
      onSubmit={(e) => {
        if (!confirm("Tem certeza que deseja apagar este orçamento?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="action" value="delete_orcamento" />
      <input type="hidden" name="id" value={id} />
      <button className="text-red-600 underline">Apagar</button>
    </form>
  );
}
