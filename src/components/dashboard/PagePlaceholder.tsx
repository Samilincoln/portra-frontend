export function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
        <p className="text-sm text-muted-foreground">
          Nothing here yet — this screen is a placeholder for the Portra build plan.
        </p>
      </div>
    </div>
  );
}
