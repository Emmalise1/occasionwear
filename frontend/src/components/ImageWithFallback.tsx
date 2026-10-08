import { useState } from 'react'

/**
 * Renders a product image and, if the file/URL fails to load, falls back to a
 * branded (never blank-gray) placeholder with the item's name.
 */
export function ImageWithFallback({
  src,
  alt,
  className = '',
  label,
}: {
  src: string | null | undefined
  alt: string
  className?: string
  label?: string
}) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return <BrandedFallback label={label ?? alt} className={className} />
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  )
}

function BrandedFallback({ label, className }: { label: string; className?: string }) {
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
  <rect width="400" height="500" fill="#F8F5F0"/>
  <rect x="14" y="14" width="372" height="472" fill="none" stroke="#C9A86A" stroke-width="2"/>
  <text x="200" y="235" font-family="Georgia, serif" font-size="72" fill="#6B1F2A" text-anchor="middle">${initials}</text>
  <text x="200" y="290" font-family="Georgia, serif" font-size="20" fill="#171717" text-anchor="middle">${escapeXml(label.slice(0, 28))}</text>
  <text x="200" y="330" font-family="Arial, sans-serif" font-size="12" letter-spacing="3" fill="#171717" opacity="0.6" text-anchor="middle">OCCASIONWEAR</text>
</svg>`

  return (
    <div
      className={`flex items-center justify-center bg-ivory ${className}`}
      role="img"
      aria-label={label}
      style={{
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
  )
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
