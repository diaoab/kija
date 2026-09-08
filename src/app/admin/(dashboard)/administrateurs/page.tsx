import { requirePermission } from "@/lib/auth";
import { getAdmins, deleteAdminAction, updateAdminPermissionsAction } from "@/lib/actions/admins";
import { getPendingPasswordResets } from "@/lib/actions/password-reset";
import { ALL_PERMISSIONS, PERMISSION_LABELS, parsePermissions } from "@/lib/permissions";
import AdminCreateForm from "@/components/admin/AdminCreateForm";
import PendingResetRow from "@/components/admin/PendingResetRow";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";

export default async function AdminAdministratorsPage() {
  const current = await requirePermission("admins");
  const [admins, pendingResets] = await Promise.all([getAdmins(), getPendingPasswordResets()]);

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">Équipe</p>
      <h1 className="mt-2 font-serif text-3xl italic">Administrateurs</h1>
      <p className="mt-2 text-sm text-muted">
        Ajoutez des membres de votre équipe et choisissez ce qu&apos;ils peuvent gérer.
      </p>

      {pendingResets.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-medium">
            Demandes de réinitialisation de mot de passe ({pendingResets.length})
          </h2>
          <div className="mt-3 space-y-3">
            {pendingResets.map((request) => (
              <PendingResetRow key={request.id} request={request} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {admins.map((admin) => {
          const permissions = parsePermissions(admin.permissions);
          const isSelf = admin.id === current.id;

          return (
            <div key={admin.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {admin.name}{" "}
                    {admin.isOwner && (
                      <span className="ml-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                        Propriétaire
                      </span>
                    )}
                    {isSelf && (
                      <span className="ml-1 rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-muted">
                        Vous
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted">{admin.email}</p>
                </div>

                {!admin.isOwner && !isSelf && (
                  <form action={deleteAdminAction}>
                    <input type="hidden" name="id" value={admin.id} />
                    <ConfirmSubmitButton
                      confirmMessage={`Supprimer l'administrateur "${admin.name}" ? Cette action est irréversible.`}
                      className="text-sm text-red-600 transition-colors hover:text-red-700"
                    >
                      Supprimer
                    </ConfirmSubmitButton>
                  </form>
                )}
              </div>

              {admin.isOwner ? (
                <p className="mt-3 text-sm text-muted">Tous les droits (propriétaire)</p>
              ) : (
                <form
                  action={updateAdminPermissionsAction}
                  className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3 border-t border-border pt-4"
                >
                  <input type="hidden" name="id" value={admin.id} />
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {ALL_PERMISSIONS.map((permission) => (
                      <label key={permission} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="permissions"
                          value={permission}
                          defaultChecked={permissions.includes(permission)}
                        />
                        {PERMISSION_LABELS[permission]}
                      </label>
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="rounded-full border border-border px-4 py-1.5 text-xs font-medium transition-colors hover:bg-foreground/5"
                  >
                    Mettre à jour les droits
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <AdminCreateForm />
      </div>
    </div>
  );
}
