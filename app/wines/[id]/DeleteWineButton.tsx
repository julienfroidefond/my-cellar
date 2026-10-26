import { Trash2 } from "lucide-react";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { deleteWineAction } from "./actions";

export default function DeleteWineButton({ id, name }: { id: string; name: string }) {
  const action = deleteWineAction.bind(null, id);

  return (
    <form action={action}>
      <ConfirmSubmitButton
        confirmMessage={`Supprimer "${name}" de la cave ?`}
        className="btn btn-ghost hover:!bg-[var(--wine-tint)] hover:!text-wine-deep"
        pendingLabel="Suppression…"
      >
        <Trash2 aria-hidden="true" />
        Supprimer
      </ConfirmSubmitButton>
    </form>
  );
}
