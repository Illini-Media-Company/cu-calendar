import clsx from 'clsx'
import {
  FEATURED_BADGE_CLASS_NAME,
  FEATURED_BADGE_COMPACT_CLASS_NAME,
  FEATURED_LABEL,
} from '../utils/featuredEvents'

interface FeaturedBadgeProps {
  className?: string
  compact?: boolean
}

export function FeaturedBadge({ className, compact = false }: FeaturedBadgeProps) {
  return (
    <span
      className={clsx(
        FEATURED_BADGE_CLASS_NAME,
        compact && FEATURED_BADGE_COMPACT_CLASS_NAME,
        className,
      )}
    >
      <i className="bi bi-star-fill" aria-hidden="true"></i>
      <span>{FEATURED_LABEL}</span>
    </span>
  )
}
