import calendarEventSvg from 'bootstrap-icons/icons/calendar-event.svg?raw'
import bookSvg from 'bootstrap-icons/icons/book.svg?raw'
import forkKnifeSvg from 'bootstrap-icons/icons/fork-knife.svg?raw'
import musicNoteSvg from 'bootstrap-icons/icons/music-note-beamed.svg?raw'
import paletteSvg from 'bootstrap-icons/icons/palette.svg?raw'
import peopleSvg from 'bootstrap-icons/icons/people-fill.svg?raw'
import starFillSvg from 'bootstrap-icons/icons/star-fill.svg?raw'
import trophySvg from 'bootstrap-icons/icons/trophy.svg?raw'
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react'
import { APP_CONFIG } from '../config'
import type { CalendarEvent } from '../types/events'
import { getCategoryAppearance } from '../utils/categoryAppearance'
import {
  buildFeaturedBadgeHtml,
  FEATURED_COLORS,
} from '../utils/featuredEvents'
import { loadGoogleMaps } from '../utils/googleMaps'
import {
  findDirectionalMarkerId,
  type ArrowKeyDirection,
  type MarkerNavigationPoint,
} from '../utils/mapKeyboardNavigation'
import { layoutOverlappingMarkerPixels } from '../utils/mapMarkerLayout'
import { getEventMarkerZIndex } from '../utils/mapMarkerOrder'
import { formatCentralRange } from '../utils/timezone'
import { CategoryBadge } from './CategoryBadge'
import styles from '../styles/App.module.css'

interface MapViewProps {
  events: CalendarEvent[]
  selectedEventUid: string
  onSelectEvent: (uid: string) => void
}

interface DisplayedMarkerLayout {
  positions: Map<string, google.maps.LatLngLiteral>
  pixels: Map<string, { x: number; y: number }>
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildInfoWindowContent(event: CalendarEvent): string {
  const appearance = getCategoryAppearance(event.event_type)
  const featuredBadge = event.highlight ? buildFeaturedBadgeHtml() : ''

  return `
    <div class="cu-map-infowindow">
      <strong>${escapeHtml(event.title)}</strong>
      <div class="cu-map-infowindow__badges">
        ${featuredBadge}
        <span
          class="cu-map-infowindow__category"
          style="--info-surface:${appearance.surface}; --info-accent:${appearance.accentDark};"
        >
          <i class="bi ${appearance.iconClass}" aria-hidden="true"></i>
          <span>${escapeHtml(appearance.category)}</span>
        </span>
      </div>
      <span>${escapeHtml(formatCentralRange(event.start_date, event.end_date))}</span>
      <span>${escapeHtml(event.address)}</span>
    </div>
  `
}

function getMarkerSvg(iconClass: string): string {
  switch (iconClass) {
    case 'bi-music-note-beamed':
      return musicNoteSvg
    case 'bi-fork-knife':
      return forkKnifeSvg
    case 'bi-palette':
      return paletteSvg
    case 'bi-trophy':
      return trophySvg
    case 'bi-people-fill':
      return peopleSvg
    case 'bi-book':
      return bookSvg
    default:
      return calendarEventSvg
  }
}

function createMarkerIcon(
  event: CalendarEvent,
  selected: boolean,
): google.maps.Icon {
  const appearance = getCategoryAppearance(event.event_type)
  const rawSvg = getMarkerSvg(appearance.iconClass)
  const rawStarSvg = starFillSvg
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/fill="currentColor"/g, `fill="${FEATURED_COLORS.surface}"`)
  const innerPaths = rawSvg
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/fill="currentColor"/g, `fill="${appearance.accentDark}"`)
  const markerSize = event.highlight ? (selected ? 56 : 52) : 42
  const anchorSize = markerSize / 2
  const featuredShellRadius = selected ? 22.75 : 21.5
  const markerRadius = event.highlight
    ? selected
      ? 19.75
      : 18.75
    : selected
      ? 21
      : 19.5

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
      ${
        event.highlight
          ? `
            <circle
              cx="28"
              cy="28"
              r="${selected ? 24.5 : 23}"
              fill="${FEATURED_COLORS.halo}"
              opacity="0.9"
            />
            <circle
              cx="28"
              cy="28"
              r="${featuredShellRadius}"
              fill="${FEATURED_COLORS.surface}"
              stroke="${FEATURED_COLORS.accentDark}"
              stroke-width="${selected ? 3 : 2.5}"
            />
          `
          : ''
      }
      <circle
        cx="28"
        cy="28"
        r="${markerRadius}"
        fill="${appearance.mapTint}"
        stroke="${appearance.accentDark}"
        stroke-width="${selected ? 4 : 3}"
      />
      <g transform="translate(20 20) scale(1)" fill="${appearance.accentDark}">
        ${innerPaths}
      </g>
      ${
        event.highlight
          ? `
            <circle
              cx="41"
              cy="15"
              r="8"
              fill="${FEATURED_COLORS.accent}"
              stroke="${FEATURED_COLORS.surface}"
              stroke-width="2"
            />
            <g transform="translate(37.1 11.1) scale(0.5)">
              ${rawStarSvg}
            </g>
          `
          : ''
      }
    </svg>
  `

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(markerSize, markerSize),
    anchor: new google.maps.Point(anchorSize, anchorSize),
  }
}

function projectLatLngToPixel(
  projection: google.maps.Projection,
  lat: number,
  lng: number,
  zoom: number,
): { x: number; y: number } | null {
  const worldPoint = projection.fromLatLngToPoint(new google.maps.LatLng(lat, lng))
  if (!worldPoint) {
    return null
  }

  const scale = 2 ** zoom

  return {
    x: worldPoint.x * scale,
    y: worldPoint.y * scale,
  }
}

function pixelToLatLng(
  projection: google.maps.Projection,
  pixel: { x: number; y: number },
  zoom: number,
): google.maps.LatLngLiteral | null {
  const scale = 2 ** zoom
  const latLng = projection.fromPointToLatLng(
    new google.maps.Point(pixel.x / scale, pixel.y / scale),
  )

  if (!latLng) {
    return null
  }

  return {
    lat: latLng.lat(),
    lng: latLng.lng(),
  }
}

function getDisplayedMarkerLayout(
  events: CalendarEvent[],
  projection: google.maps.Projection,
  zoom: number,
  selectedEventUid: string,
): DisplayedMarkerLayout {
  const basePositions = new Map<string, google.maps.LatLngLiteral>()
  const pixelPositions = new Map<string, { x: number; y: number }>()
  const pixelPoints = []

  for (const event of events) {
    const basePosition = {
      lat: event.lat as number,
      lng: event.long as number,
    }

    basePositions.set(event.uid, basePosition)

    const pixelPoint = projectLatLngToPixel(
      projection,
      basePosition.lat,
      basePosition.lng,
      zoom,
    )

    if (!pixelPoint) {
      continue
    }

    pixelPositions.set(event.uid, pixelPoint)
    pixelPoints.push({
      id: event.uid,
      x: pixelPoint.x,
      y: pixelPoint.y,
      priority: getEventMarkerZIndex(event, selectedEventUid),
    })
  }

  const adjustedPixels = layoutOverlappingMarkerPixels(pixelPoints, zoom)

  adjustedPixels.forEach((pixelPoint, eventUid) => {
    pixelPositions.set(eventUid, pixelPoint)

    const adjustedLatLng = pixelToLatLng(projection, pixelPoint, zoom)
    if (!adjustedLatLng) {
      return
    }

    basePositions.set(eventUid, adjustedLatLng)
  })

  return {
    positions: basePositions,
    pixels: pixelPositions,
  }
}

export function MapView({ events, selectedEventUid, onSelectEvent }: MapViewProps) {
  const mapCanvasRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const markerByIdRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const displayedMarkerPixelsRef = useRef<Map<string, { x: number; y: number }>>(
    new Map(),
  )
  const [mapError, setMapError] = useState('')
  const [mapLayoutVersion, setMapLayoutVersion] = useState(0)

  const handleMarkerSelectEvent = useEffectEvent((uid: string) => {
    onSelectEvent(uid)
  })

  const eventsWithCoordinates = useMemo(
    () =>
      events.filter(
        (event) =>
          typeof event.lat === 'number' && typeof event.long === 'number',
      ),
    [events],
  )
  const visibleCategories = useMemo(
    () => [...new Set(eventsWithCoordinates.map((event) => event.event_type))],
    [eventsWithCoordinates],
  )
  const selectedEvent = useMemo(
    () =>
      eventsWithCoordinates.find((event) => event.uid === selectedEventUid) ??
      null,
    [eventsWithCoordinates, selectedEventUid],
  )

  useEffect(() => {
    let cancelled = false
    let zoomListener: google.maps.MapsEventListener | null = null
    let projectionListener: google.maps.MapsEventListener | null = null

    async function initializeMap() {
      try {
        const googleApi = await loadGoogleMaps()
        const mapsLibrary =
          (await googleApi.maps.importLibrary(
            'maps',
          )) as google.maps.MapsLibrary

        if (cancelled || !mapCanvasRef.current || mapRef.current) {
          return
        }

        mapRef.current = new mapsLibrary.Map(mapCanvasRef.current, {
          center: APP_CONFIG.mapCenter,
          zoom: APP_CONFIG.mapZoom,
          disableDefaultUI: true,
          keyboardShortcuts: false,
          zoomControl: true,
          fullscreenControl: true,
          mapTypeControl: false,
          streetViewControl: false,
        })
        infoWindowRef.current = new mapsLibrary.InfoWindow()
        const bumpMarkerLayout = () => {
          setMapLayoutVersion((previous) => previous + 1)
        }
        zoomListener = mapRef.current.addListener('zoom_changed', bumpMarkerLayout)
        projectionListener = mapRef.current.addListener('projection_changed', bumpMarkerLayout)
        bumpMarkerLayout()
        setMapError('')
      } catch (error) {
        if (!cancelled) {
          setMapError(
            error instanceof Error
              ? error.message
              : 'Google Maps failed to initialize.',
          )
        }
      }
    }

    initializeMap()

    return () => {
      cancelled = true
      zoomListener?.remove()
      projectionListener?.remove()
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const infoWindow = infoWindowRef.current
    const markerById = markerByIdRef.current

    if (!map || !infoWindow) {
      return
    }

    const zoom = map.getZoom() ?? APP_CONFIG.mapZoom
    const projection = map.getProjection()
    const displayedLayout = projection
      ? getDisplayedMarkerLayout(
          eventsWithCoordinates,
          projection,
          zoom,
          selectedEventUid,
        )
      : {
          positions: new Map<string, google.maps.LatLngLiteral>(),
          pixels: new Map<string, { x: number; y: number }>(),
        }
    const displayedPositions = displayedLayout.positions
    displayedMarkerPixelsRef.current = displayedLayout.pixels

    markerById.forEach((marker) => {
      marker.setMap(null)
    })
    markerById.clear()

    eventsWithCoordinates.forEach((event) => {
      const marker = new google.maps.Marker({
        title: event.title,
        position:
          displayedPositions.get(event.uid) ?? {
            lat: event.lat as number,
            lng: event.long as number,
          },
        map,
        icon: createMarkerIcon(event, event.uid === selectedEventUid),
        zIndex: getEventMarkerZIndex(event, selectedEventUid),
      })

      marker.addListener('click', () => {
        handleMarkerSelectEvent(event.uid)
        infoWindow.setContent(buildInfoWindowContent(event))
        infoWindow.open({
          anchor: marker,
          map,
        })
      })

      markerById.set(event.uid, marker)
    })

    return () => {
      markerById.forEach((marker) => {
        marker.setMap(null)
      })
      markerById.clear()
      displayedMarkerPixelsRef.current = new Map()
    }
  }, [eventsWithCoordinates, mapLayoutVersion, selectedEventUid])

  useEffect(() => {
    if (!mapRef.current || !selectedEvent) {
      return
    }

    mapRef.current.panTo({
      lat: selectedEvent.lat as number,
      lng: selectedEvent.long as number,
    })
  }, [selectedEvent])

  const handleMapKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (
      event.key !== 'ArrowLeft' &&
      event.key !== 'ArrowRight' &&
      event.key !== 'ArrowUp' &&
      event.key !== 'ArrowDown'
    ) {
      return
    }

    const map = mapRef.current
    if (!map || eventsWithCoordinates.length === 0) {
      return
    }

    const navigationPoints: MarkerNavigationPoint[] = eventsWithCoordinates.flatMap(
      (mapEvent) => {
        const pixel = displayedMarkerPixelsRef.current.get(mapEvent.uid)
        return pixel ? [{ id: mapEvent.uid, x: pixel.x, y: pixel.y }] : []
      },
    )

    if (navigationPoints.length === 0) {
      return
    }

    const selectedPixel = selectedEventUid
      ? displayedMarkerPixelsRef.current.get(selectedEventUid) ?? null
      : null
    const zoom = map.getZoom() ?? APP_CONFIG.mapZoom
    const projection = map.getProjection()
    const mapCenter = map.getCenter()
    const centerPixel =
      projection && mapCenter
        ? projectLatLngToPixel(projection, mapCenter.lat(), mapCenter.lng(), zoom)
        : null
    const anchor = selectedPixel ?? centerPixel

    if (!anchor) {
      return
    }

    const nextEventUid = findDirectionalMarkerId(
      navigationPoints,
      anchor,
      event.key as ArrowKeyDirection,
      selectedEventUid,
    )

    if (!nextEventUid) {
      return
    }

    event.preventDefault()
    onSelectEvent(nextEventUid)
    event.currentTarget.focus()
  }

  return (
    <section className={styles.mapPanel} aria-label="Map view">
      <div
        ref={mapCanvasRef}
        className={styles.mapCanvas}
        tabIndex={0}
        onKeyDown={handleMapKeyDown}
        aria-label="Map view. Use arrow keys to move between event pins."
      ></div>

      {visibleCategories.length > 0 ? (
        <div className={styles.mapLegend} aria-label="Category legend">
          {visibleCategories.map((category) => (
            <CategoryBadge key={category} category={category} />
          ))}
        </div>
      ) : null}

      {mapError ? (
        <p className={styles.mapError}>{mapError}</p>
      ) : null}

      {eventsWithCoordinates.length === 0 ? (
        <p className={styles.emptyState}>No mappable events match this filter set.</p>
      ) : null}
    </section>
  )
}
