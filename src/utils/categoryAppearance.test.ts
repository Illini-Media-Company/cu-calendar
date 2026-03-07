import { describe, expect, it } from 'vitest'
import { getCategoryAppearance, getCategoryBadgeStyle } from './categoryAppearance'

describe('categoryAppearance', () => {
  it('returns themed icon metadata for known categories', () => {
    const appearance = getCategoryAppearance('Music')

    expect(appearance.iconClass).toBe('bi-music-note-beamed')
    expect(appearance.accent).toBe('#e68805')
    expect(appearance.mapTint).toBe('#fdecd3')
  })

  it('falls back for unknown categories', () => {
    const appearance = getCategoryAppearance('Wellness')

    expect(appearance.category).toBe('Wellness')
    expect(appearance.iconClass).toBe('bi-calendar-event')
  })

  it('returns css variables for badge styling', () => {
    const style = getCategoryBadgeStyle('Food')

    expect(style).toMatchObject({
      '--category-accent': '#43a047',
      '--category-surface': '#e8f5e9',
    })
  })
})
