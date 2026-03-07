import type { CSSProperties } from 'react'

interface CategoryAppearance {
  category: string
  iconClass: string
  accent: string
  accentDark: string
  surface: string
  mapTint: string
}

const PALETTE = {
  gray900: '#212121',
  gray700: '#616161',
  gray100: '#f5f5f5',
  gray50: '#fafafa',
  imcOrange800: '#8d5301',
  imcOrange600: '#e68805',
  imcOrange100: '#fdecd3',
  imcOrange50: '#fef4e7',
  wpguGreen800: '#2e7d32',
  wpguGreen600: '#43a047',
  wpguGreen100: '#c8e6c9',
  wpguGreen50: '#e8f5e9',
  pink800: '#ad1457',
  pink600: '#d81b60',
  pink100: '#f8bbd0',
  pink50: '#fce4ec',
  blue800: '#1565c0',
  blue600: '#1e88e5',
  blue100: '#bbdefb',
  blue50: '#e3f2fd',
  yellow800: '#f9a825',
  yellow100: '#fff9c4',
  yellow50: '#fffde7',
  brown700: '#5d4037',
  illiniBlue700: '#0e1f3b',
  illiniBlue500: '#13294b',
  illiniBlue100: '#b8bfc9',
  illiniBlue50: '#e3e5e9',
} as const

const DEFAULT_APPEARANCE: CategoryAppearance = {
  category: 'Uncategorized',
  iconClass: 'bi-calendar-event',
  accent: PALETTE.gray700,
  accentDark: PALETTE.gray900,
  surface: PALETTE.gray100,
  mapTint: PALETTE.gray50,
}

const CATEGORY_APPEARANCES: Record<string, CategoryAppearance> = {
  music: {
    category: 'Music',
    iconClass: 'bi-music-note-beamed',
    accent: PALETTE.imcOrange600,
    accentDark: PALETTE.imcOrange800,
    surface: PALETTE.imcOrange50,
    mapTint: PALETTE.imcOrange100,
  },
  food: {
    category: 'Food',
    iconClass: 'bi-fork-knife',
    accent: PALETTE.wpguGreen600,
    accentDark: PALETTE.wpguGreen800,
    surface: PALETTE.wpguGreen50,
    mapTint: PALETTE.wpguGreen100,
  },
  arts: {
    category: 'Arts',
    iconClass: 'bi-palette',
    accent: PALETTE.pink600,
    accentDark: PALETTE.pink800,
    surface: PALETTE.pink50,
    mapTint: PALETTE.pink100,
  },
  sports: {
    category: 'Sports',
    iconClass: 'bi-trophy',
    accent: PALETTE.blue600,
    accentDark: PALETTE.blue800,
    surface: PALETTE.blue50,
    mapTint: PALETTE.blue100,
  },
  community: {
    category: 'Community',
    iconClass: 'bi-people-fill',
    accent: PALETTE.yellow800,
    accentDark: PALETTE.brown700,
    surface: PALETTE.yellow50,
    mapTint: PALETTE.yellow100,
  },
  education: {
    category: 'Education',
    iconClass: 'bi-book',
    accent: PALETTE.illiniBlue500,
    accentDark: PALETTE.illiniBlue700,
    surface: PALETTE.illiniBlue50,
    mapTint: PALETTE.illiniBlue100,
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
