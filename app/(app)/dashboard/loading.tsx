export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-48 bg-muted" />
        <div className="h-9 w-36 bg-muted" />
      </div>

      {/* Stats row — 3 cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {["stat-1", "stat-2", "stat-3"].map((card) => (
          <div
            className="border border-border bg-card p-5 space-y-2"
            key={card}
          >
            <div className="h-3 w-20 bg-muted" />
            <div className="h-7 w-12 bg-muted" />
            <div className="h-3 w-24 bg-muted" />
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {["action-1", "action-2"].map((action) => (
          <div className="h-9 w-36 bg-muted" key={action} />
        ))}
      </div>

      {/* Two column content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {["panel-1", "panel-2"].map((panel) => (
          <div
            className="border border-border bg-card p-5 space-y-4"
            key={panel}
          >
            <div className="h-5 w-32 bg-muted" />
            {["item-1", "item-2", "item-3"].map((item) => (
              <div
                className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                key={item}
              >
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-full bg-muted" />
                  <div className="h-3 w-2/3 bg-muted" />
                </div>
                <div className="h-5 w-16 bg-muted shrink-0" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
