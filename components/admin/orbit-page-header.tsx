export function OrbitPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8 border-b border-border pb-5">
      <div className="border-l-[3px] border-l-primary pl-4">
        {eyebrow && (
          <p className="mb-2 font-bold text-xs text-primary uppercase tracking-eyebrow">
            {eyebrow}
          </p>
        )}
        <h1 className="font-black text-3xl tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1.5 text-muted-foreground text-sm">{description}</p>
        )}
      </div>
    </div>
  );
}
