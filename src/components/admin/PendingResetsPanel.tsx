"use client";

import { useState } from "react";
import PendingResetRow from "@/components/admin/PendingResetRow";

type ResetRequest = { id: string; admin: { name: string; email: string }; createdAt: Date };

/**
 * Panneau client délibérément déconnecté des re-rendus serveur : `useState`
 * ne lit `initialRequests` qu'au montage, jamais lors des re-rendus suivants
 * (déclenchés par le `revalidatePath` des actions d'approbation/rejet).
 *
 * Sans ça, une approbation retire immédiatement la demande de la liste
 * `pending` côté serveur -> son <PendingResetRow> est démonté avant que
 * l'admin ait pu voir/copier le mot de passe temporaire affiché en retour
 * de son propre useActionState. Ici, seul un rejet explicite (onRejected)
 * retire une ligne de l'état local ; une approbation la transforme en
 * affichage de succès qui reste jusqu'à ce que l'admin quitte la page.
 */
export default function PendingResetsPanel({
  initialRequests,
}: {
  initialRequests: ResetRequest[];
}) {
  const [requests, setRequests] = useState(initialRequests);

  const handleRejected = (id: string) => {
    setRequests((current) => current.filter((request) => request.id !== id));
  };

  if (requests.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="text-sm font-medium">
        Demandes de réinitialisation de mot de passe ({requests.length})
      </h2>
      <div className="mt-3 space-y-3">
        {requests.map((request) => (
          <PendingResetRow key={request.id} request={request} onRejected={handleRejected} />
        ))}
      </div>
    </div>
  );
}
