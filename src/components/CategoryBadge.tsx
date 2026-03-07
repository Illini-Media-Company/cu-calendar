import type { CSSProperties } from 'react'
import { getCategoryAppearance, getCategoryBadgeStyle } from '../utils/categoryAppearance'
import styles from '../styles/App.module.css'

interface CategoryBadgeProps {
  category: string
  className?: string
}

export function CategoryBadge({ category, className = '' }: CategoryBadgeProps) {
  const appearance = getCategoryAppearance(category)
  const style = getCategoryBadgeStyle(category) as CSSProperties

  return (
    <span className={`${styles.eventPill} ${className}`.trim()} style={style}>
      <i className={`bi ${appearance.iconClass} ${styles.categoryGlyph}`} aria-hidden="true"></i>
      <span>{appearance.category}</span>
    </span>
  )
}
