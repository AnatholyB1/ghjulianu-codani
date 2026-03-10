'use client';

import { useTransition } from 'react';

interface Props {
  formAction: () => Promise<void>;
  message:    string;
  style?:     React.CSSProperties;
  children:   React.ReactNode;
}

export default function ConfirmButton({ formAction, message, style, children }: Props) {
  const [pending, start] = useTransition();

  function handleClick() {
    if (!confirm(message)) return;
    start(() => formAction());
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      style={{ ...style, opacity: pending ? 0.5 : 1, cursor: pending ? 'wait' : 'pointer' }}
    >
      {pending ? '…' : children}
    </button>
  );
}
