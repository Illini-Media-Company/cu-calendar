import { describe, expect, it } from 'vitest'
import { formatCentralDateTime, formatCentralRange } from './timezone'

describe('timezone helpers', () => {
  it('formats single datetime in central time', () => {
    const formatted = formatCentralDateTime('2026-03-12T20:00:00-05:00')
    expect(formatted.endsWith('CT')).toBe(true)
  })

  it('formats central range on one line for same day events', () => {
    const formatted = formatCentralRange(
      '2026-03-12T20:00:00-05:00',
      '2026-03-12T21:30:00-05:00',
    )

    expect(formatted).toContain('CT')
    expect(formatted).toContain('-')
  })

  it('returns TBD for invalid dates', () => {
    expect(formatCentralDateTime('invalid')).toBe('TBD')
  })
})
