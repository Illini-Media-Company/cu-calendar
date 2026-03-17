import {
  MarkerClusterer,
  type Cluster,
  type Renderer,
} from '@googlemaps/markerclusterer'
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
  clusterHasFeaturedEvents,
  getClusterCountLabel,
  getInitialClusterEventIndex,
  sortClusterEventsForBrowse,
} from '../utils/mapClusters'
import {
  findDirectionalMarkerId,
  type ArrowKeyDirection,
  type MarkerNavigationPoint,
} from '../utils/mapKeyboardNavigation'
import { getEventMarkerZIndex } from '../utils/mapMarkerOrder'
import { formatCentralRange } from '../utils/timezone'
import { CategoryBadge } from './CategoryBadge'
import styles from '../styles/App.module.css'

interface MapViewProps {
  events: CalendarEvent[]
  selectedEventUid: string
  onSelectEvent: (uid: string) => void
}

const CLUSTER_COLORS = {
  accent: '#1e88e5',
  accentDark: '#0e1f3b',
  surface: '#e3f2fd',
  surfaceStrong: '#bbdefb',
  halo: 'rgba(30, 136, 229, 0.22)',
} as const

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

function getMarkerPosition(event: CalendarEvent): google.maps.LatLngLiteral {
  return {
    lat: event.lat as number,
    lng: event.long as number,
  }
}

function buildCategoryBadgeHtml(event: CalendarEvent): string {
  const appearance = getCategoryAppearance(event.event_type)

  return `
    <span
      class="cu-map-infowindow__category"
      style="--info-surface:${appearance.surface}; --info-accent:${appearance.accentDark};"
    >
      <i class="bi ${appearance.iconClass}" aria-hidden="true"></i>
      <span>${escapeHtml(appearance.category)}</span>
    </span>
  `
}

function getClusterMarkerSize(countLabel: string): number {
  if (countLabel.length >= 3) {
    return 60
  }

  return 56
}

function createClusterMarkerIcon(
  countLabel: string,
  hasFeaturedEvent: boolean,
): google.maps.Icon {
  const markerSize = getClusterMarkerSize(countLabel)
  const colors = hasFeaturedEvent ? FEATURED_COLORS : CLUSTER_COLORS
  const rawStarSvg = starFillSvg
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/fill="currentColor"/g, `fill="${FEATURED_COLORS.surface}"`)
  const fontSize = countLabel.length >= 3 ? 16 : 18

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="26" fill="${colors.halo}" />
      <circle
        cx="32"
        cy="32"
        r="22"
        fill="${colors.surface}"
        stroke="${colors.accentDark}"
        stroke-width="2.5"
      />
      <circle
        cx="32"
        cy="32"
        r="16.5"
        fill="${colors.surfaceStrong}"
        stroke="${colors.accent}"
        stroke-width="1.75"
      />
      <text
        x="32"
        y="38"
        text-anchor="middle"
        font-family="'Futura PT Local', futura-pt, Futura, system-ui, sans-serif"
        font-size="${fontSize}"
        font-weight="800"
        fill="${colors.accentDark}"
      >
        ${countLabel}
      </text>
      ${
        hasFeaturedEvent
          ? `
            <circle
              cx="47"
              cy="17"
              r="8"
              fill="${FEATURED_COLORS.accent}"
              stroke="${FEATURED_COLORS.surface}"
              stroke-width="2"
            />
            <g transform="translate(43.15 13.1) scale(0.5)">
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
    anchor: new google.maps.Point(markerSize / 2, markerSize / 2),
  }
}

function getClusterEvents(
  cluster: Cluster,
  eventByMarker: WeakMap<object, CalendarEvent>,
): CalendarEvent[] {
  return sortClusterEventsForBrowse(
    cluster.markers.flatMap((marker) => {
      const event = eventByMarker.get(marker)
      return event ? [event] : []
    }),
  )
}

function createClusterBrowserContent({
  clusterEvents,
  initialIndex,
  onSelectEvent,
}: {
  clusterEvents: CalendarEvent[]
  initialIndex: number
  onSelectEvent: (uid: string) => void
}): HTMLDivElement {
  const container = document.createElement('div')
  container.className = 'cu-map-infowindow cu-cluster-infowindow'
  container.innerHTML = `
    <div class="cu-cluster-infowindow__eyebrow">${clusterEvents.length} nearby events</div>
    <strong class="cu-cluster-infowindow__title"></strong>
    <div class="cu-map-infowindow__badges cu-cluster-infowindow__badges"></div>
    <span class="cu-cluster-infowindow__time"></span>
    <span class="cu-cluster-infowindow__address"></span>
    <div class="cu-cluster-infowindow__controls">
      <button type="button" class="cu-cluster-infowindow__navButton" data-action="previous">
        Prev
      </button>
      <span class="cu-cluster-infowindow__position"></span>
      <button type="button" class="cu-cluster-infowindow__navButton" data-action="next">
        Next
      </button>
    </div>
    <button type="button" class="cu-cluster-infowindow__actionButton" data-action="details">
      Show details
    </button>
  `

  const titleElement = container.querySelector('.cu-cluster-infowindow__title')
  const badgesElement = container.querySelector('.cu-cluster-infowindow__badges')
  const timeElement = container.querySelector('.cu-cluster-infowindow__time')
  const addressElement = container.querySelector('.cu-cluster-infowindow__address')
  const positionElement = container.querySelector('.cu-cluster-infowindow__position')
  const previousButton = container.querySelector<HTMLButtonElement>(
    '[data-action="previous"]',
  )
  const nextButton = container.querySelector<HTMLButtonElement>(
    '[data-action="next"]',
  )
  const detailsButton = container.querySelector<HTMLButtonElement>(
    '[data-action="details"]',
  )

  if (
    !titleElement ||
    !badgesElement ||
    !timeElement ||
    !addressElement ||
    !positionElement ||
    !previousButton ||
    !nextButton ||
    !detailsButton
  ) {
    return container
  }

  let activeIndex = initialIndex

  const renderActiveEvent = () => {
    const activeEvent = clusterEvents[activeIndex]
    titleElement.textContent = activeEvent.title
    badgesElement.innerHTML = [
      activeEvent.highlight ? buildFeaturedBadgeHtml(true) : '',
      buildCategoryBadgeHtml(activeEvent),
    ]
      .filter(Boolean)
      .join('')
    timeElement.textContent = formatCentralRange(
      activeEvent.start_date,
      activeEvent.end_date,
    )
    addressElement.textContent = activeEvent.address
    positionElement.textContent = `${activeIndex + 1} of ${clusterEvents.length}`
  }

  const step = (direction: -1 | 1) => {
    activeIndex =
      (activeIndex + direction + clusterEvents.length) % clusterEvents.length
    renderActiveEvent()
  }

  previousButton.disabled = clusterEvents.length <= 1
  nextButton.disabled = clusterEvents.length <= 1
  previousButton.addEventListener('click', () => {
    step(-1)
  })
  nextButton.addEventListener('click', () => {
    step(1)
  })
  detailsButton.addEventListener('click', () => {
    onSelectEvent(clusterEvents[activeIndex].uid)
  })

  renderActiveEvent()

  return container
}

export function MapView({ events, selectedEventUid, onSelectEvent }: MapViewProps) {
  const mapCanvasRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const markerByIdRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const eventByMarkerRef = useRef<WeakMap<object, CalendarEvent>>(new WeakMap())
  const [mapError, setMapError] = useState('')

  const handleMarkerSelectEvent = useEffectEvent((uid: string) => {
    onSelectEvent(uid)
  })
  const handleClusterEventSelect = useEffectEvent((uid: string) => {
    infoWindowRef.current?.close()
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
  const clusterRenderer = useMemo<Renderer>(
    () => ({
      render(cluster) {
        const clusterEvents = getClusterEvents(cluster, eventByMarkerRef.current)
        const countLabel = getClusterCountLabel(cluster.count)
        const hasFeaturedEvent = clusterHasFeaturedEvents(clusterEvents)

        return new google.maps.Marker({
          position: cluster.position,
          icon: createClusterMarkerIcon(countLabel, hasFeaturedEvent),
          title: `${cluster.count} nearby events`,
          zIndex: 1000 + cluster.count,
        })
      },
    }),
    [],
  )
  const handleClusterClick = useEffectEvent(
    (_event: google.maps.MapMouseEvent, cluster: Cluster, map: google.maps.Map) => {
      const infoWindow = infoWindowRef.current
      if (!infoWindow) {
        return
      }

      const clusterEvents = getClusterEvents(cluster, eventByMarkerRef.current)
      if (clusterEvents.length === 0) {
        return
      }

      const content = createClusterBrowserContent({
        clusterEvents,
        initialIndex: getInitialClusterEventIndex(
          clusterEvents,
          selectedEventUid,
        ),
        onSelectEvent: handleClusterEventSelect,
      })
      infoWindow.close()
      infoWindow.setContent(content)
      infoWindow.setPosition(cluster.position)
      infoWindow.open({ map })
    },
  )

  useEffect(() => {
    let cancelled = false

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
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const infoWindow = infoWindowRef.current
    const clusterer = clustererRef.current
    const markerById = markerByIdRef.current

    if (!map || !infoWindow) {
      return
    }

    clusterer?.clearMarkers()
    markerById.forEach((marker) => {
      marker.setMap(null)
    })
    markerById.clear()
    eventByMarkerRef.current = new WeakMap()

    const markers: google.maps.Marker[] = []

    eventsWithCoordinates.forEach((event) => {
      const marker = new google.maps.Marker({
        title: event.title,
        position: getMarkerPosition(event),
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
      eventByMarkerRef.current.set(marker, event)
      markers.push(marker)
    })

    clustererRef.current = new MarkerClusterer({
      map,
      markers,
      renderer: clusterRenderer,
      onClusterClick: handleClusterClick,
    })

    return () => {
      clustererRef.current?.clearMarkers()
      clustererRef.current = null
      markerById.forEach((marker) => {
        marker.setMap(null)
      })
      markerById.clear()
      eventByMarkerRef.current = new WeakMap()
    }
  }, [clusterRenderer, eventsWithCoordinates, selectedEventUid])

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

    const zoom = map.getZoom() ?? APP_CONFIG.mapZoom
    const projection = map.getProjection()
    if (!projection) {
      return
    }

    const navigationPoints: MarkerNavigationPoint[] = eventsWithCoordinates.flatMap(
      (mapEvent) => {
        const pixel = projectLatLngToPixel(
          projection,
          mapEvent.lat as number,
          mapEvent.long as number,
          zoom,
        )
        return pixel ? [{ id: mapEvent.uid, x: pixel.x, y: pixel.y }] : []
      },
    )

    if (navigationPoints.length === 0) {
      return
    }

    const selectedPixel =
      selectedEvent && typeof selectedEvent.lat === 'number' && typeof selectedEvent.long === 'number'
        ? projectLatLngToPixel(
            projection,
            selectedEvent.lat,
            selectedEvent.long,
            zoom,
          )
        : null
    const mapCenter = map.getCenter()
    const centerPixel =
      mapCenter
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
