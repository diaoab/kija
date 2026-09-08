"use client";

import { useState } from "react";
import Image from "next/image";
import { deletePropertyImageAction } from "@/lib/actions/properties";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";

type Category = { id: string; name: string };
type ExistingImage = { id: string; url: string };

const inputClass =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/15";

export default function PropertyForm({
  action,
  categories,
  property,
}: {
  action: (formData: FormData) => void | Promise<void>;
  categories: Category[];
  property?: {
    id: string;
    title: string;
    description: string;
    rentalType: string;
    pricePerNight: number | null;
    pricePerMonth: number | null;
    categoryId: string;
    city: string;
    address: string;
    bedrooms: number;
    bathrooms: number;
    surfaceM2: number;
    isFeatured: boolean;
    images: ExistingImage[];
  };
}) {
  const [pending, setPending] = useState(false);
  const [rentalType, setRentalType] = useState(property?.rentalType ?? "SHORT");

  return (
    <div className="max-w-xl space-y-6">
      {/* Rendu en dehors du <form> ci-dessous : chaque photo a son propre
          formulaire de suppression, et le HTML n'autorise pas les <form>
          imbriqués. */}
      {property && property.images.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <span className="text-sm font-medium">Photos actuelles</span>
          <div className="mt-2.5 flex flex-wrap gap-3">
            {property.images.map((image) => (
              <div key={image.id} className="relative">
                <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-background">
                  <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
                </div>
                <form action={deletePropertyImageAction} className="absolute -right-2 -top-2">
                  <input type="hidden" name="imageId" value={image.id} />
                  <input type="hidden" name="propertyId" value={property.id} />
                  <ConfirmSubmitButton
                    confirmMessage="Supprimer cette photo ?"
                    title="Supprimer cette photo"
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-xs leading-5 text-background"
                  >
                    ×
                  </ConfirmSubmitButton>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      <form
        action={action}
        onSubmit={() => setPending(true)}
        className="space-y-6 rounded-2xl border border-border bg-surface p-6"
      >
        {property && <input type="hidden" name="id" value={property.id} />}

        <label className="block">
          <span className="text-sm font-medium">Titre du bien</span>
          <input type="text" name="title" required defaultValue={property?.title} className={inputClass} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Catégorie</span>
          <select
            name="categoryId"
            required
            defaultValue={property?.categoryId ?? ""}
            className={`${inputClass} bg-background`}
          >
            <option value="" disabled>
              Choisir une catégorie
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Type de location</span>
          <select
            name="rentalType"
            required
            value={rentalType}
            onChange={(event) => setRentalType(event.target.value)}
            className={`${inputClass} bg-background`}
          >
            <option value="SHORT">Courte durée (prix par nuit)</option>
            <option value="LONG">Longue durée (prix par mois)</option>
          </select>
        </label>

        {rentalType === "SHORT" ? (
          <label className="block">
            <span className="text-sm font-medium">Prix par nuit (FCFA)</span>
            <input
              type="number"
              name="pricePerNight"
              min={0}
              step={1}
              required
              defaultValue={property?.pricePerNight ?? undefined}
              className={inputClass}
            />
          </label>
        ) : (
          <label className="block">
            <span className="text-sm font-medium">Prix par mois (FCFA)</span>
            <input
              type="number"
              name="pricePerMonth"
              min={0}
              step={1}
              required
              defaultValue={property?.pricePerMonth ?? undefined}
              className={inputClass}
            />
          </label>
        )}

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium">Ville</span>
            <input type="text" name="city" required defaultValue={property?.city} className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Adresse</span>
            <input type="text" name="address" required defaultValue={property?.address} className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <label className="block">
            <span className="text-sm font-medium">Chambres</span>
            <input
              type="number"
              name="bedrooms"
              min={0}
              step={1}
              required
              defaultValue={property?.bedrooms ?? 0}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Salles de bain</span>
            <input
              type="number"
              name="bathrooms"
              min={0}
              step={1}
              required
              defaultValue={property?.bathrooms ?? 0}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Surface (m²)</span>
            <input
              type="number"
              name="surfaceM2"
              min={0}
              step={1}
              required
              defaultValue={property?.surfaceM2 ?? 0}
              className={inputClass}
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Description</span>
          <textarea
            name="description"
            required
            rows={5}
            defaultValue={property?.description}
            className={inputClass}
          />
        </label>

        <label className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3.5 py-3">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={property?.isFeatured ?? false}
            className="h-4 w-4"
          />
          <span className="text-sm font-medium">Mettre à la une</span>
          <span className="text-xs text-muted">
            (affiché dans la section « À la une » de la page d&apos;accueil)
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-medium">
            {property ? "Ajouter des photos" : "Photos"}
          </span>
          <input
            type="file"
            name="images"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            className="mt-1.5 w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-foreground file:px-4 file:py-2.5 file:text-sm file:text-background"
          />
          <span className="text-xs text-muted">JPG, PNG, WEBP ou GIF, 5 Mo max par photo.</span>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Enregistrement..." : property ? "Enregistrer" : "Ajouter le bien"}
        </button>
      </form>
    </div>
  );
}
