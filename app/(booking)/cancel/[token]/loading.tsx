export default function CancelLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md overflow-hidden bg-card border border-border animate-pulse">
        <div className="flex items-center gap-3 border-b border-border bg-muted/20 px-6 py-6">
          <div className="h-6 w-6 bg-muted" />
          <div className="h-5 w-36 bg-muted" />
        </div>
        <div className="px-6 py-6 space-y-4">
          <div className="border border-border bg-muted/20 p-4 space-y-2">
            <div className="h-4 w-40 bg-muted" />
            <div className="h-3 w-24 bg-muted" />
            <div className="h-3 w-32 bg-muted" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-20 bg-muted" />
            <div className="h-20 w-full bg-muted" />
          </div>
          <div className="h-11 w-full bg-muted" />
        </div>
      </div>
    </main>
  )
}
