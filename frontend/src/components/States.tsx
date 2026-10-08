import type { ReactNode } from 'react'

/** Accessible loading state used by every API-driven page. */
export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" role="status">
      <span
        className="h-10 w-10 animate-spin rounded-full border-2 border-taupe border-t-gold"
        aria-hidden="true"
      />
      <p className="label-caps">{label}…</p>
    </div>
  )
}

/** Skeleton grid for outfit cards while data loads. */
export function CardSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card animate-pulse overflow-hidden">
          <div className="aspect-[3/4] bg-taupe/50" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 rounded bg-taupe/50" />
            <div className="h-3 w-1/2 rounded bg-taupe/40" />
            <div className="h-9 w-full rounded bg-taupe/30" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Error state with retry — never leave users on a blank screen. */
export function ErrorState({
  message,
  onRetry,
  title = 'Something went wrong',
}: {
  message: string
  onRetry?: () => void
  title?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full bg-burgundy/10 text-burgundy"
        aria-hidden="true"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </span>
      <div>
        <h3 className="font-display text-xl text-ink">{title}</h3>
        <p className="mt-1 max-w-md text-sm text-ink/60">{message}</p>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-outline">
          Try again
        </button>
      )}
    </div>
  )
}

/** Empty state with guidance and an optional action. */
export function EmptyState({
  title,
  message,
  action,
}: {
  title: string
  message: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold-dark"
        aria-hidden="true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 7h16l-1.5 13h-13L4 7z" />
          <path d="M9 7a3 3 0 0 1 6 0" />
        </svg>
      </span>
      <div>
        <h3 className="font-display text-xl text-ink">{title}</h3>
        <p className="mt-1 max-w-md text-sm text-ink/60">{message}</p>
      </div>
      {action}
    </div>
  )
}
