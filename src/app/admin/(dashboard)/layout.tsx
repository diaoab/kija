import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import { getCurrentAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { getPendingPasswordResetCount } from "@/lib/actions/password-reset";
import { getPendingReservationCount } from "@/lib/actions/reservations";
import MobileNavToggle from "@/components/MobileNavToggle";

const linkClass =
  "rounded-full px-3 py-1.5 text-brand/80 transition-colors hover:bg-brand/10 hover:text-brand-light";
const mobileLinkClass =
  "rounded-lg px-3 py-2.5 text-brand/80 transition-colors hover:bg-brand/10 hover:text-brand-light";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [admin, settings] = await Promise.all([getCurrentAdmin(), getSiteSettings()]);
  if (!admin) redirect("/admin/login");
  if (admin.mustChangePassword) redirect("/admin/changer-mot-de-passe");

  const can = (permission: string) => admin.isOwner || admin.permissions.includes(permission as never);
  const [pendingResets, pendingReservations] = await Promise.all([
    can("admins") ? getPendingPasswordResetCount() : 0,
    can("reservations") ? getPendingReservationCount() : 0,
  ]);

  const navItems = [
    can("properties") && { href: "/admin/proprietes", label: "Propriétés" },
    can("categories") && { href: "/admin/categories", label: "Catégories" },
    can("reservations") && {
      href: "/admin/reservations",
      label: "Réservations",
      badge: pendingReservations > 0 ? pendingReservations : undefined,
    },
    can("content") && { href: "/admin/parametres", label: "Contenu du site" },
    can("admins") && {
      href: "/admin/administrateurs",
      label: "Administrateurs",
      badge: pendingResets > 0 ? pendingResets : undefined,
    },
    { href: "/", label: "Voir le site", external: true },
  ].filter(Boolean) as { href: string; label: string; badge?: number; external?: boolean }[];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-ink-border bg-ink">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-1 sm:gap-3">
            <Link href="/admin" className="mr-1 flex shrink-0 items-center gap-2 font-serif italic text-gold sm:mr-3">
              {settings.logoUrl ? (
                <span className="relative flex h-7 w-7 overflow-hidden rounded-full border border-brand/40">
                  <Image
                    src={settings.logoUrl}
                    alt={settings.siteName}
                    fill
                    sizes="28px"
                    className="object-cover"
                  />
                </span>
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-brand/40 text-xs text-gold">
                  {settings.siteName.charAt(0) || "B"}
                </span>
              )}
              <span className="hidden sm:inline">Administration</span>
            </Link>

            <nav className="hidden items-center gap-1 text-sm sm:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  className={`flex items-center gap-1.5 ${linkClass}`}
                >
                  {item.label}
                  {!!item.badge && (
                    <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-medium text-brand-foreground">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden text-sm text-brand/70 sm:inline">{admin.name}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm text-brand/70 transition-colors hover:text-brand-light"
              >
                Déconnexion
              </button>
            </form>
            <MobileNavToggle>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  className={`flex items-center justify-between ${mobileLinkClass}`}
                >
                  {item.label}
                  {!!item.badge && (
                    <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-medium text-brand-foreground">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </MobileNavToggle>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
