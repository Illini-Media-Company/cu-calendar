export type ArrowKeyDirection =
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'ArrowUp'
  | 'ArrowDown'

export interface MarkerNavigationPoint {
  id: string
  x: number
  y: number
}

const SECONDARY_AXIS_WEIGHT = 2

function getDirectionalScore(
  point: MarkerNavigationPoint,
  anchor: Pick<MarkerNavigationPoint, 'x' | 'y'>,
  direction: ArrowKeyDirection,
): { primaryDistance: number; secondaryDistance: number; score: number } | null {
  const dx = point.x - anchor.x
  const dy = point.y - anchor.y

  switch (direction) {
    case 'ArrowLeft': {
      if (dx >= 0) {
        return null
      }

      const primaryDistance = Math.abs(dx)
      const secondaryDistance = Math.abs(dy)

      return {
        primaryDistance,
        secondaryDistance,
        score: primaryDistance + secondaryDistance * SECONDARY_AXIS_WEIGHT,
      }
    }
    case 'ArrowRight': {
      if (dx <= 0) {
        return null
      }

      const primaryDistance = dx
      const secondaryDistance = Math.abs(dy)

      return {
        primaryDistance,
        secondaryDistance,
        score: primaryDistance + secondaryDistance * SECONDARY_AXIS_WEIGHT,
      }
    }
    case 'ArrowUp': {
      if (dy >= 0) {
        return null
      }

      const primaryDistance = Math.abs(dy)
      const secondaryDistance = Math.abs(dx)

      return {
        primaryDistance,
        secondaryDistance,
        score: primaryDistance + secondaryDistance * SECONDARY_AXIS_WEIGHT,
      }
    }
    case 'ArrowDown': {
      if (dy <= 0) {
        return null
      }

      const primaryDistance = dy
      const secondaryDistance = Math.abs(dx)

      return {
        primaryDistance,
        secondaryDistance,
        score: primaryDistance + secondaryDistance * SECONDARY_AXIS_WEIGHT,
      }
    }
  }
}

export function findDirectionalMarkerId(
  points: MarkerNavigationPoint[],
  anchor: Pick<MarkerNavigationPoint, 'x' | 'y'>,
  direction: ArrowKeyDirection,
  currentMarkerId?: string,
): string | null {
  let bestMatch:
    | (MarkerNavigationPoint & {
        primaryDistance: number
        secondaryDistance: number
        score: number
      })
    | null = null

  for (const point of points) {
    if (point.id === currentMarkerId) {
      continue
    }

    const score = getDirectionalScore(point, anchor, direction)
    if (!score) {
      continue
    }

    if (
      !bestMatch ||
      score.score < bestMatch.score ||
      (score.score === bestMatch.score &&
        (score.primaryDistance < bestMatch.primaryDistance ||
          (score.primaryDistance === bestMatch.primaryDistance &&
            (score.secondaryDistance < bestMatch.secondaryDistance ||
              (score.secondaryDistance === bestMatch.secondaryDistance &&
                point.id.localeCompare(bestMatch.id) < 0)))))
    ) {
      bestMatch = {
        ...point,
        ...score,
      }
    }
  }

  return bestMatch?.id ?? null
}
