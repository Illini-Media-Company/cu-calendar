export interface MarkerPixelPoint {
  id: string
  x: number
  y: number
  priority: number
}

interface PixelPoint {
  x: number
  y: number
}

interface MarkerLayoutOptions {
  maxSpreadZoom?: number
  overlapThresholdPx?: number
  offsetDistancePx?: number
}

const DEFAULT_MAX_SPREAD_ZOOM = 15
const DEFAULT_OVERLAP_THRESHOLD_PX = 18
const DEFAULT_OFFSET_DISTANCE_PX = 24
const POSITIONS_PER_RING = 6

function distanceSquared(a: PixelPoint, b: PixelPoint): number {
  const dx = a.x - b.x
  const dy = a.y - b.y

  return dx * dx + dy * dy
}

export function layoutOverlappingMarkerPixels(
  points: MarkerPixelPoint[],
  zoom: number,
  options: MarkerLayoutOptions = {},
): Map<string, PixelPoint> {
  const {
    maxSpreadZoom = DEFAULT_MAX_SPREAD_ZOOM,
    overlapThresholdPx = DEFAULT_OVERLAP_THRESHOLD_PX,
    offsetDistancePx = DEFAULT_OFFSET_DISTANCE_PX,
  } = options

  const positions = new Map(
    points.map((point) => [
      point.id,
      {
        x: point.x,
        y: point.y,
      },
    ]),
  )

  if (points.length < 2 || zoom > maxSpreadZoom) {
    return positions
  }

  const thresholdSquared = overlapThresholdPx * overlapThresholdPx
  const visited = new Set<number>()

  for (let index = 0; index < points.length; index += 1) {
    if (visited.has(index)) {
      continue
    }

    const clusterIndexes = [index]
    visited.add(index)

    for (let cursor = 0; cursor < clusterIndexes.length; cursor += 1) {
      const clusterIndex = clusterIndexes[cursor]

      for (let candidate = 0; candidate < points.length; candidate += 1) {
        if (visited.has(candidate)) {
          continue
        }

        if (
          distanceSquared(points[clusterIndex], points[candidate]) <= thresholdSquared
        ) {
          visited.add(candidate)
          clusterIndexes.push(candidate)
        }
      }
    }

    if (clusterIndexes.length === 1) {
      continue
    }

    const cluster = clusterIndexes
      .map((clusterIndex) => points[clusterIndex])
      .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))

    const anchor = cluster[0]
    positions.set(anchor.id, { x: anchor.x, y: anchor.y })

    cluster.slice(1).forEach((point, offsetIndex) => {
      const ring = Math.floor(offsetIndex / POSITIONS_PER_RING)
      const slot = offsetIndex % POSITIONS_PER_RING
      const radius = offsetDistancePx * (ring + 1)
      const angle = (Math.PI * 2 * slot) / POSITIONS_PER_RING

      positions.set(point.id, {
        x: anchor.x + Math.cos(angle) * radius,
        y: anchor.y + Math.sin(angle) * radius,
      })
    })
  }

  return positions
}
