export default function BookingPageLoading() {
  return (
    <div className="relative min-h-screen bg-[#F3F7F6] p-4 md:p-6 lg:flex lg:h-screen lg:items-center lg:p-8">
      <div className="mx-auto w-full max-w-[900px] overflow-hidden bg-white border border-border lg:flex lg:h-full lg:max-h-[680px] lg:flex-col">

        {/* Progress bar skeleton */}
        <div className="flex items-center justify-center gap-0 border-b border-gray-100 bg-white px-6 py-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center">
              {i > 1 && <div className="h-px w-16 bg-gray-100" />}
              <div className="mx-1 flex items-center gap-1.5 px-1">
                <div className="h-5 w-5 rounded-full bg-gray-100 animate-pulse" />
                <div className="hidden h-3 w-10 rounded bg-gray-100 animate-pulse sm:block" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">

          {/* Left info panel skeleton */}
          <div className="flex shrink-0 flex-col gap-5 border-b border-gray-100 bg-[#F8FCFB] p-6 lg:w-[230px] lg:border-b-0 lg:border-r">
            <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3 w-20 rounded bg-gray-200 animate-pulse" />
              <div className="h-3 w-28 rounded bg-gray-100 animate-pulse" />
            </div>
            <div className="h-px w-full bg-gray-100" />
            <div className="space-y-2">
              <div className="h-4 w-36 rounded bg-gray-200 animate-pulse" />
              <div className="h-3 w-48 rounded bg-gray-100 animate-pulse" />
              <div className="h-3 w-40 rounded bg-gray-100 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
              <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
            </div>
          </div>

          {/* Calendar panel skeleton */}
          <div className="shrink-0 border-b border-gray-100 p-6 lg:w-[320px] lg:border-b-0 lg:border-r">
            <div className="mb-5 h-4 w-32 rounded bg-gray-200 animate-pulse" />
            {/* Month nav */}
            <div className="mb-4 flex items-center justify-between">
              <div className="h-8 w-8 rounded bg-gray-100 animate-pulse" />
              <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
              <div className="h-8 w-8 rounded bg-gray-100 animate-pulse" />
            </div>
            {/* Day grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="flex items-center justify-center p-0.5">
                  <div className="h-9 w-9 rounded-full bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 20}ms` }} />
                </div>
              ))}
            </div>
          </div>

          {/* Slots panel skeleton */}
          <div className="flex flex-1 flex-col justify-center gap-4 p-6">
            <div className="h-3 w-20 rounded bg-gray-200 animate-pulse" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 w-full rounded bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
