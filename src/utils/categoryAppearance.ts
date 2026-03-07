import type { CSSProperties } from 'react'

interface CategoryAppearance {
  category: string
  iconClass: string
  accent: string
  accentDark: string
  surface: string
  mapTint: string
}

const DEFAULT_APPEARANCE: CategoryAppearance = {
  category: 'Uncategorized',
  iconClass: 'bi-calendar-event',
  accent: '#616161',
  accentDark: '#424242',
  surface: '#f5f5f5',
  mapTint: '#f5f5f5',
}

const CATEGORY_APPEARANCES: Record<string, CategoryAppearance> = {
  music: {
    category: 'Music',
    iconClass: 'bi-music-note-beamed',
    accent: '#e68805',
    accentDark: '#b96b00',
    surface: '#fff1dc',
    mapTint: '#ffedd1',
  },
  food: {
    category: 'Food',
    iconClass: 'bi-fork-knife',
    accent: '#2f8f46',
    accentDark: '#256d36',
    surface: '#e9f7ed',
    mapTint: '#dff2e4',
  },
  arts: {
    category: 'Arts',
    iconClass: 'bi-palette',
    accent: '#c65f33',
    accentDark: '#9e4b28',
    surface: '#fbe9e1',
    mapTint: '#f8dece',
  },
  sports: {
    category: 'Sports',
    iconClass: 'bi-trophy',
    accent: '#2563a6',
    accentDark: '#184a7d',
    surface: '#e4eef9',
    mapTint: '#d8e7f8',
  },
  community: {
    category: 'Community',
    iconClass: 'bi-people-fill',
    accent: '#7a5f14',
    accentDark: '#5a470d',
    surface: '#f8f0cf',
    mapTint: '#f3e7bb',
  },
  education: {
    category: 'Education',
    iconClass: 'bi-book',
    accent: '#0b7f88',
    accentDark: '#086068',
    surface: '#e0f5f7',
    mapTint: '#d2eef1',
  },
}

function normalizeCategory(category: string): string {
  return category.trim().toLowerCase()
}

export function getCategoryAppearance(category: string): CategoryAppearance {
  return CATEGORY_APPEARANCES[normalizeCategory(category)] ?? {
    ...DEFAULT_APPEARANCE,
    category: category || DEFAULT_APPEARANCE.category,
  }
}

export function getCategoryBadgeStyle(category: string): CSSProperties {
  const appearance = getCategoryAppearance(category)
  return {
    '--category-accent': appearance.accent,
    '--category-accent-dark': appearance.accentDark,
    '--category-surface': appearance.surface,
  } as CSSProperties
}

export function getCategoryLegendEntries(categories: string[]): CategoryAppearance[] {
  return categories.map((category) => getCategoryAppearance(category))
}
