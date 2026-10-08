import type { BookingStatus, OutfitStatus, PaymentStatus } from '../types'
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_STYLES,
  OUTFIT_STATUS_LABELS,
  OUTFIT_STATUS_STYLES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
} from '../utils/format'

type Kind = 'booking' | 'payment' | 'outfit'

export function StatusBadge({
  kind,
  value,
}: {
  kind: Kind
  value: BookingStatus | PaymentStatus | OutfitStatus
}) {
  const style =
    kind === 'booking'
      ? BOOKING_STATUS_STYLES[value as BookingStatus]
      : kind === 'payment'
        ? PAYMENT_STATUS_STYLES[value as PaymentStatus]
        : OUTFIT_STATUS_STYLES[value as OutfitStatus]

  const label =
    kind === 'booking'
      ? BOOKING_STATUS_LABELS[value as BookingStatus]
      : kind === 'payment'
        ? PAYMENT_STATUS_LABELS[value as PaymentStatus]
        : OUTFIT_STATUS_LABELS[value as OutfitStatus]

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${style}`}
    >
      {label}
    </span>
  )
}
