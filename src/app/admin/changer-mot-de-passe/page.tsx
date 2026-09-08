import { requireAdmin } from "@/lib/auth";
import ChangePasswordForm from "@/components/admin/ChangePasswordForm";

export default async function ChangePasswordPage() {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-7 shadow-sm">
        <h1 className="font-serif text-xl italic">
          {admin.mustChangePassword ? "Bienvenue" : "Changer mon mot de passe"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {admin.mustChangePassword
            ? "Votre compte vient d'être créé (ou réinitialisé). Vous pouvez choisir un nouveau mot de passe ou conserver celui qui vous a été communiqué."
            : "Choisissez un nouveau mot de passe pour votre compte."}
        </p>

        <ChangePasswordForm canKeepCurrent={admin.mustChangePassword} />
      </div>
    </div>
  );
}
