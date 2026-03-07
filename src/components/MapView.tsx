import { useMemo } from 'react'
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import L from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import type { CalendarEvent } from '../types/events'
import { APP_CONFIG } from '../config'
import { formatCentralRange } from '../utils/timezone'
import styles from '../styles/App.module.css'

const eventMarkerIcon = L.divIcon({
  className: 'cu-calendar-marker-container',
  html: '<span class="cu-calendar-marker-pin" aria-hidden="true"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -10],
})

interface MapViewProps {
  events: CalendarEvent[]
  selectedEventUid: string
  onSelectEvent: (uid: string) => void
}

export function MapView({ events, selectedEventUid, onSelectEvent }: MapViewProps) {
  const eventsWithCoordinates = useMemo(
    () => events.filter((event) => typeof event.lat === 'number' && typeof event.long === 'number'),
    [events],
  )

  const center: LatLngExpression = [APP_CONFIG.mapCenter.lat, APP_CONFIG.mapCenter.lng]

  return (
    <section className={styles.mapPanel} aria-label="Map view">
      <MapContainer
        center={center}
        zoom={APP_CONFIG.mapZoom}
        scrollWheelZoom
        className={styles.mapCanvas}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterGroup chunkedLoading>
          {eventsWithCoordinates.map((event) => (
            <Marker
              key={event.uid}
              position={[event.lat as number, event.long as number]}
              icon={eventMarkerIcon}
              eventHandlers={{
                click: () => onSelectEvent(event.uid),
              }}
            >
              <Popup>
                <div className={styles.popupCard}>
                  <h3>{event.name}</h3>
                  <p>{formatCentralRange(event.startDate, event.endDate)}</p>
                  <p>{event.address}</p>
                  <button
                    type="button"
                    className={styles.inlineLinkButton}
                    onClick={() => onSelectEvent(event.uid)}
                  >
                    {selectedEventUid === event.uid ? 'Selected' : 'View details'}
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {eventsWithCoordinates.length === 0 ? (
        <p className={styles.emptyState}>No mappable events match this filter set.</p>
      ) : null}
    </section>
  )
}
