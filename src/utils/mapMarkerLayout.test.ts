import { describe, expect, it } from 'vitest'
import { layoutOverlappingMarkerPixels } from './mapMarkerLayout'

describe('layoutOverlappingMarkerPixels', () => {
  it('keeps overlapping points offset for one extra zoom level', () => {
    const positions = layoutOverlappingMarkerPixels(
      [
        { id: 'top', x: 100, y: 100, priority: 20 },
        { id: 'covered', x: 100, y: 100, priority: 5 },
      ],
      15,
    )

    expect(positions.get('top')).toEqual({ x: 100, y: 100 })
    expect(positions.get('covered')).not.toEqual({ x: 100, y: 100 })
  })

  it('keeps original positions when zoomed in closely', () => {
    const positions = layoutOverlappingMarkerPixels(
      [
        { id: 'a', x: 100, y: 100, priority: 10 },
        { id: 'b', x: 100, y: 100, priority: 5 },
      ],
      16,
    )

    expect(positions.get('a')).toEqual({ x: 100, y: 100 })
    expect(positions.get('b')).toEqual({ x: 100, y: 100 })
  })

  it('keeps the highest-priority point in place and offsets the covered one', () => {
    const positions = layoutOverlappingMarkerPixels(
      [
        { id: 'top', x: 100, y: 100, priority: 20 },
        { id: 'covered', x: 100, y: 100, priority: 5 },
      ],
      12,
    )

    expect(positions.get('top')).toEqual({ x: 100, y: 100 })
    expect(positions.get('covered')).not.toEqual({ x: 100, y: 100 })
  })

  it('does not move points that are already separated', () => {
    const positions = layoutOverlappingMarkerPixels(
      [
        { id: 'a', x: 100, y: 100, priority: 10 },
        { id: 'b', x: 160, y: 100, priority: 5 },
      ],
      12,
    )

    expect(positions.get('a')).toEqual({ x: 100, y: 100 })
    expect(positions.get('b')).toEqual({ x: 160, y: 100 })
  })
})
