import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { removeStockAction } from "./actions";

export default function RemoveStockButton({ vintageId }: { vintageId: string }) {
  const action = removeStockAction.bind(null, vintageId);

  return (
    <form action={action}>
      <ConfirmSubmitButton
        confirmMessage="Retirer une bouteille du stock ?"
        pendingLabel="…"
      className="px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40 shrink-0"
      style={{
        background: "rgba(26,10,14,0.05)",
        border: "1px solid rgba(26,10,14,0.15)",
        color: "var(--text-muted)",
        fontFamily: "var(--font-inter)",
      }}
      >
        Retirer
      </ConfirmSubmitButton>
    </form>
  );
}
