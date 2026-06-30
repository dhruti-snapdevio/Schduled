import type { ReactNode } from "react";

export function OrbitPageHeader({
  title,
  description,
  actions,
}: {
  // Accepted for backwards-compat with existing call sites, but no longer
  // rendered — page eyebrows were removed across the app.
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1
          className="font-black text-3xl tracking-tight sm:text-4xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">{description}</p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
