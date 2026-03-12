import { describe, expect, it } from 'vitest'
import { findDirectionalMarkerId } from './mapKeyboardNavigation'

describe('findDirectionalMarkerId', () => {
  it('selects the nearest marker to the right with the best directional alignment', () => {
    const markerId = findDirectionalMarkerId(
      [
        { id: 'right-aligned', x: 130, y: 100 },
        { id: 'right-diagonal', x: 120, y: 120 },
        { id: 'left', x: 80, y: 100 },
      ],
      { x: 100, y: 100 },
      'ArrowRight',
    )

    expect(markerId).toBe('right-aligned')
  })

  it('navigates upward relative to the current marker', () => {
    const markerId = findDirectionalMarkerId(
      [
        { id: 'selected', x: 100, y: 100 },
        { id: 'up-close', x: 103, y: 82 },
        { id: 'up-far', x: 100, y: 50 },
      ],
      { x: 100, y: 100 },
      'ArrowUp',
      'selected',
    )

    expect(markerId).toBe('up-close')
  })

  it('returns null when there is no marker in the requested direction', () => {
    const markerId = findDirectionalMarkerId(
      [
        { id: 'left', x: 50, y: 100 },
        { id: 'up', x: 100, y: 40 },
      ],
      { x: 100, y: 100 },
      'ArrowRight',
    )

    expect(markerId).toBeNull()
  })

  it('prefers the smallest off-axis distance when directional scores tie', () => {
    const markerId = findDirectionalMarkerId(
      [
        { id: 'wider', x: 120, y: 110 },
        { id: 'tighter', x: 130, y: 100 },
      ],
      { x: 100, y: 100 },
      'ArrowRight',
    )

    expect(markerId).toBe('tighter')
  })
})
