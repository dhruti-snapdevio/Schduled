import type { ReactNode } from "react";

export function OrbitPageHeader({
  eyebrow = "Admin Panel",
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4 border-b border-border pb-6">
      <div className="border-l-[3px] border-l-primary pl-4">
        {eyebrow && (
          <p className="mb-1.5 font-bold text-xs text-primary uppercase tracking-eyebrow">
            {eyebrow}
          </p>
        )}
        <h1
          className="font-black text-4xl tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-base text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
