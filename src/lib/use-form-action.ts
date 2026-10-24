"use client";

import { startTransition, useActionState } from "react";
import type { ActionState } from "./types";

/**
 * Like useActionState, but submits through onSubmit so React does not reset
 * the form — what the user typed stays in place when validation fails.
 */
export function useFormAction(action: (prev: ActionState, formData: FormData) => Promise<ActionState>) {
  const [state, dispatch, pending] = useActionState(action, null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => dispatch(formData));
  };

  return { state, onSubmit, pending };
}
