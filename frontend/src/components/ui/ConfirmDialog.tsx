"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Spinner } from "./Spinner";

export interface ConfirmDialogProps {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  /** Destructive actions get the red button. */
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

/** Yes/no dialog that stays open with a spinner until `onConfirm` settles. */
export function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onClose }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // The caller reports the error (usually as a toast); just re-enable the buttons.
      setBusy(false);
    }
  };

  return (
    <Modal
      title={title}
      onClose={busy ? () => {} : onClose}
      maxWidth={420}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={danger ? "btn btn-danger" : "btn btn-primary"} onClick={confirm} disabled={busy}>
            {busy && <Spinner size={12} />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-[13px] text-secondary">{message}</div>
    </Modal>
  );
}
