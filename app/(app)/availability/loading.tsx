const days = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7']

export default function AvailabilityLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 bg-muted" />
        <div className="h-9 w-28 bg-muted" />
      </div>

      {/* Day rows */}
      <div className="border border-border">
        {days.map((d, i) => (
          <div
            key={d}
            className={`flex items-center gap-4 px-5 py-4 ${i < days.length - 1 ? 'border-b border-border' : ''}`}
          >
            <div className="h-4 w-4 bg-muted shrink-0" />
            <div className="w-24 shrink-0 h-3.5 bg-muted" />
            <div className="flex gap-2 flex-1">
              <div className="h-8 w-24 bg-muted" />
              <div className="h-4 w-4 bg-muted self-center" />
              <div className="h-8 w-24 bg-muted" />
            </div>
          </div>
        ))}
      </div>

      {/* Overrides section */}
      <div className="space-y-2">
        <div className="h-5 w-32 bg-muted" />
        <div className="h-3 w-64 bg-muted" />
        <div className="h-9 w-40 bg-muted" />
      </div>
    </div>
  )
}
