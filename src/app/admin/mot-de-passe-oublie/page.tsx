import Image from "next/image";
import { getSiteSettings } from "@/lib/settings";
import ForgotPasswordForm from "@/components/admin/ForgotPasswordForm";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const settings = await getSiteSettings();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-7 shadow-sm">
        {settings.logoUrl ? (
          <span className="relative flex h-10 w-10 overflow-hidden rounded-full border border-border">
            <Image src={settings.logoUrl} alt={settings.siteName} fill sizes="40px" className="object-cover" />
          </span>
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground font-serif text-lg italic text-background">
            {settings.siteName.charAt(0) || "B"}
          </span>
        )}
        <h1 className="mt-4 font-serif text-xl italic">Mot de passe oublié</h1>
        <p className="mt-1 text-sm text-muted">
          Indiquez votre email : un administrateur devra approuver la réinitialisation.
        </p>

        <ForgotPasswordForm />
      </div>
    </div>
  );
}
