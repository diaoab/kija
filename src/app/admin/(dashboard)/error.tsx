"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6">
      <h1 className="font-serif text-lg italic text-red-700">Une erreur est survenue</h1>
      <p className="mt-2 text-sm text-red-700/80">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 rounded-full border border-red-200 bg-white px-4 py-2 text-sm transition-colors hover:bg-red-100"
      >
        Réessayer
      </button>
    </div>
  );
}
