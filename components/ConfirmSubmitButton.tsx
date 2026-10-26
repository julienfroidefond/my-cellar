"use client";

import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
  confirmMessage?: string;
  pendingLabel?: string;
  className?: string;
  style?: React.CSSProperties;
};

export default function ConfirmSubmitButton({
  children,
  confirmMessage,
  pendingLabel = "…",
  className,
  style,
}: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className}
      style={style}
      disabled={pending}
      aria-busy={pending || undefined}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
