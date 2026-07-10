import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { deleteWineAction } from "./actions";

export default function DeleteWineButton({ id, name }: { id: string; name: string }) {
  const action = deleteWineAction.bind(null, id);

  return (
    <form action={action}>
      <ConfirmSubmitButton
        confirmMessage={`Supprimer "${name}" de la cave ?`}
        className="text-sm transition-opacity opacity-60 hover:opacity-100 hover:underline disabled:opacity-40"
        style={{ color: "#c0374e", fontFamily: "var(--font-inter)" }}
      >
        Supprimer ce vin
      </ConfirmSubmitButton>
    </form>
  );
}
