"use client";

export default function DeleteItemButton({
  itemId,
  orcamentoId,
}: {
  itemId: string;
  orcamentoId: string;
}) {
  return (
    <form
      action="/api/orcamentos"
      method="POST"
      onSubmit={(e) => {
        if (!confirm("Apagar este item do orçamento?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="action" value="delete_item" />
      <input type="hidden" name="item_id" value={itemId} />
      <input type="hidden" name="orcamento_id" value={orcamentoId} />
      <button className="text-red-600 underline">Apagar</button>
    </form>
  );
}
