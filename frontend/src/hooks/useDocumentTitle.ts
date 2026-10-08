import { useEffect } from 'react'

const BRAND_SUFFIX = 'OccasionWear'

/**
 * Sets `document.title` while the component is mounted and restores the
 * previous title on unmount.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} · ${BRAND_SUFFIX}` : `OccasionWear — Dress for the Moment`
    return () => {
      document.title = previous
    }
  }, [title])
}
