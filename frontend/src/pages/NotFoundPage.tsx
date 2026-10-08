import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="label-caps text-gold-dark">404</p>
      <h1 className="mt-3 text-4xl text-ink">This page left the rack</h1>
      <p className="mt-3 text-sm text-ink/60">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/" className="btn-primary">
          Back home
        </Link>
        <Link to="/outfits" className="btn-outline">
          Browse collection
        </Link>
      </div>
    </div>
  )
}
