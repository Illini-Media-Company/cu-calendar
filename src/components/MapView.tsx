import { MarkerClusterer } from '@googlemaps/markerclusterer'
import calendarEventSvg from 'bootstrap-icons/icons/calendar-event.svg?raw'
import bookSvg from 'bootstrap-icons/icons/book.svg?raw'
import forkKnifeSvg from 'bootstrap-icons/icons/fork-knife.svg?raw'
import musicNoteSvg from 'bootstrap-icons/icons/music-note-beamed.svg?raw'
import paletteSvg from 'bootstrap-icons/icons/palette.svg?raw'
import peopleSvg from 'bootstrap-icons/icons/people-fill.svg?raw'
import trophySvg from 'bootstrap-icons/icons/trophy.svg?raw'
import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react'
import { APP_CONFIG } from '../config'
import type { CalendarEvent } from '../types/events'
import { getCategoryAppearance } from '../utils/categoryAppearance'
import { loadGoogleMaps } from '../utils/googleMaps'
import { formatCentralRange } from '../utils/timezone'
import { CategoryBadge } from './CategoryBadge'
import styles from '../styles/App.module.css'

interface MapViewProps {
  events: CalendarEvent[]
  selectedEventUid: string
  onSelectEvent: (uid: string) => void
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
  const appearance = getCategoryAppearance(event.categoryType)

  return `
    <div class="cu-map-infowindow">
      <strong>${escapeHtml(event.name)}</strong>
      <span
        class="cu-map-infowindow__category"
        style="--info-surface:${appearance.surface}; --info-accent:${appearance.accentDark};"
      >
        <i class="bi ${appearance.iconClass}" aria-hidden="true"></i>
        <span>${escapeHtml(appearance.category)}</span>
      </span>
      <span>${escapeHtml(formatCentralRange(event.startDate, event.endDate))}</span>
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
  const appearance = getCategoryAppearance(event.categoryType)
  const rawSvg = getMarkerSvg(appearance.iconClass)
  const innerPaths = rawSvg
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/fill="currentColor"/g, `fill="${appearance.accentDark}"`)

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
      <circle
        cx="28"
        cy="28"
        r="${selected ? 21 : 19.5}"
        fill="${appearance.mapTint}"
        stroke="${appearance.accentDark}"
        stroke-width="${selected ? 4 : 3}"
      />
      <g transform="translate(20 20) scale(1)" fill="${appearance.accentDark}">
        ${innerPaths}
      </g>
    </svg>
  `

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(42, 42),
    anchor: new google.maps.Point(21, 21),
  }
}

export function MapView({ events, selectedEventUid, onSelectEvent }: MapViewProps) {
  const mapCanvasRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const markerByIdRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const [mapError, setMapError] = useState('')

  const handleSelectEvent = useEffectEvent((uid: string) => {
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
    () => [...new Set(eventsWithCoordinates.map((event) => event.categoryType))],
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
    const markerById = markerByIdRef.current

    if (!map || !infoWindow) {
      return
    }

    clustererRef.current?.clearMarkers()
    markerById.forEach((marker) => {
      marker.setMap(null)
    })
    markerById.clear()

    const markers = eventsWithCoordinates.map((event) => {
      const marker = new google.maps.Marker({
        title: event.name,
        position: {
          lat: event.lat as number,
          lng: event.long as number,
        },
        map,
        icon: createMarkerIcon(event, event.uid === selectedEventUid),
      })

      marker.addListener('click', () => {
        handleSelectEvent(event.uid)
        infoWindow.setContent(buildInfoWindowContent(event))
        infoWindow.open({
          anchor: marker,
          map,
        })
      })

      markerById.set(event.uid, marker)
      return marker
    })

    clustererRef.current = new MarkerClusterer({
      map,
      markers,
    })

    return () => {
      clustererRef.current?.clearMarkers()
      markerById.forEach((marker) => {
        marker.setMap(null)
      })
      markerById.clear()
    }
  }, [eventsWithCoordinates, selectedEventUid])

  useEffect(() => {
    if (!mapRef.current || !selectedEvent) {
      return
    }

    mapRef.current.panTo({
      lat: selectedEvent.lat as number,
      lng: selectedEvent.long as number,
    })
  }, [selectedEvent])

  return (
    <section className={styles.mapPanel} aria-label="Map view">
      <div ref={mapCanvasRef} className={styles.mapCanvas}></div>

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
