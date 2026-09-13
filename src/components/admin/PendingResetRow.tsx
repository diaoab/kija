"use client";

import { useActionState, useEffect } from "react";
import {
  approvePasswordResetAction,
  rejectPasswordResetAction,
  type ApproveResetState,
  type RejectResetState,
} from "@/lib/actions/password-reset";

const initialApproveState: ApproveResetState = {};
const initialRejectState: RejectResetState = {};

export default function PendingResetRow({
  request,
  onRejected,
}: {
  request: { id: string; admin: { name: string; email: string }; createdAt: Date };
  onRejected: (id: string) => void;
}) {
  const [approveState, approveFormAction, approvePending] = useActionState(
    approvePasswordResetAction,
    initialApproveState
  );
  const [rejectState, rejectFormAction, rejectPending] = useActionState(
    rejectPasswordResetAction,
    initialRejectState
  );

  // La ligne ne quitte la liste locale que sur ce signal explicite — jamais
  // via le revalidatePath du serveur, qui démonterait aussi le message de
  // succès de l'approbation (voir PendingResetsPanel).
  useEffect(() => {
    if (rejectState.rejected) onRejected(request.id);
  }, [rejectState.rejected, onRejected, request.id]);

  if (approveState.tempPassword) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <p className="text-sm text-green-800">
          Nouveau mot de passe temporaire pour <strong>{approveState.adminName}</strong> :
        </p>
        <p className="mt-1 select-all rounded-md bg-white px-3 py-2 font-mono text-sm text-green-900">
          {approveState.tempPassword}
        </p>
        <p className="mt-2 text-xs text-green-700">
          {approveState.emailSent
            ? "Un email contenant ce mot de passe a été envoyé à la personne concernée."
            : "L'email n'a pas pu être envoyé (service d'envoi non configuré) — communiquez ce mot de passe en privé à la personne concernée."}{" "}
          Elle devra le changer (ou le conserver) à sa prochaine connexion.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand/5 p-4">
      <div>
        <p className="text-sm font-medium">{request.admin.name}</p>
        <p className="text-xs text-muted">{request.admin.email}</p>
      </div>
      <div className="flex items-center gap-2">
        <form action={rejectFormAction}>
          <input type="hidden" name="requestId" value={request.id} />
          <button
            type="submit"
            disabled={rejectPending}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-foreground/5 disabled:opacity-50"
          >
            {rejectPending ? "..." : "Rejeter"}
          </button>
        </form>
        <form action={approveFormAction}>
          <input type="hidden" name="requestId" value={request.id} />
          <button
            type="submit"
            disabled={approvePending}
            className="rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {approvePending ? "..." : "Approuver"}
          </button>
        </form>
      </div>
      {approveState.error && <p className="w-full text-xs text-red-600">{approveState.error}</p>}
      {rejectState.error && <p className="w-full text-xs text-red-600">{rejectState.error}</p>}
    </div>
  );
}
