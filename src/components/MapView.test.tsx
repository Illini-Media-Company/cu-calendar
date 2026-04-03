import { render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CalendarEvent } from '../types/events'
import { MapView } from './MapView'

const {
  clustererConfigs,
  loadGoogleMapsMock,
  mapInstances,
} = vi.hoisted(() => ({
  clustererConfigs: [] as Array<{ markers: unknown[] }>,
  loadGoogleMapsMock: vi.fn(),
  mapInstances: [] as unknown[],
}))

vi.mock('../utils/googleMaps', () => ({
  loadGoogleMaps: loadGoogleMapsMock,
}))

vi.mock('@googlemaps/markerclusterer', () => ({
  MarkerClusterer: class MockMarkerClusterer {
    clearMarkers = vi.fn()

    constructor(config: { markers: unknown[] }) {
      clustererConfigs.push({ markers: config.markers })
    }
  },
}))

class MockMap {
  panTo = vi.fn()
  getZoom = vi.fn(() => 12)
  getProjection = vi.fn(() => ({
    fromLatLngToPoint: () => ({
      x: 1,
      y: 1,
    }),
  }))
  getCenter = vi.fn(() => ({
    lat: () => 40.1106,
    lng: () => -88.2073,
  }))

  constructor() {
    mapInstances.push(this)
  }
}

class MockInfoWindow {
  close = vi.fn()
  setContent = vi.fn()
  setPosition = vi.fn()
  open = vi.fn()
}

class MockMarker {
  setMap = vi.fn()
  addListener = vi.fn()

  constructor() {
    // Marker construction side effects are captured by clusterer marker counts.
  }
}

class MockSize {
  constructor() {}
}

class MockPoint {
  constructor() {}
}

class MockLatLng {
  private readonly latValue: number
  private readonly lngValue: number

  constructor(latValue: number, lngValue: number) {
    this.latValue = latValue
    this.lngValue = lngValue
  }

  lat() {
    return this.latValue
  }

  lng() {
    return this.lngValue
  }
}

function buildEvent(
  overrides: Partial<CalendarEvent> & Pick<CalendarEvent, 'uid'>,
): CalendarEvent {
  return {
    uid: overrides.uid,
    title: overrides.title ?? 'Quad concert',
    description: overrides.description ?? 'Live music on the quad.',
    event_type: overrides.event_type ?? 'Music',
    highlight: overrides.highlight ?? false,
    start_date: overrides.start_date ?? '2026-04-10T18:00:00-05:00',
    end_date: overrides.end_date ?? '2026-04-10T20:00:00-05:00',
    address: overrides.address ?? 'Main Quad',
    lat: overrides.lat ?? 40.1106,
    long: overrides.long ?? -88.2073,
    url: overrides.url ?? null,
    images: overrides.images ?? [],
  }
}

describe('MapView', () => {
  beforeEach(() => {
    clustererConfigs.length = 0
    mapInstances.length = 0

    const googleMock = {
      maps: {
        Marker: MockMarker,
        Size: MockSize,
        Point: MockPoint,
        LatLng: MockLatLng,
        importLibrary: vi.fn().mockResolvedValue({
          Map: MockMap,
          InfoWindow: MockInfoWindow,
        }),
      },
    }

    window.google = googleMock as unknown as typeof google
    loadGoogleMapsMock.mockReset()
    loadGoogleMapsMock.mockResolvedValue(googleMock as unknown as typeof google)
  })

  afterEach(() => {
    vi.clearAllMocks()
    Reflect.deleteProperty(window, 'google')
  })

  it('recreates markers when remounted with events already loaded', async () => {
    const onSelectEvent = vi.fn()
    const event = buildEvent({ uid: 'evt-001' })

    const firstRender = render(
      <MapView events={[]} selectedEventUid="" onSelectEvent={onSelectEvent} />,
    )

    await waitFor(() => {
      expect(mapInstances).toHaveLength(1)
    })

    firstRender.rerender(
      <MapView events={[event]} selectedEventUid="" onSelectEvent={onSelectEvent} />,
    )

    await waitFor(() => {
      expect(clustererConfigs.at(-1)?.markers).toHaveLength(1)
    })

    const clustererCountBeforeRemount = clustererConfigs.length

    firstRender.unmount()

    render(<MapView events={[event]} selectedEventUid="" onSelectEvent={onSelectEvent} />)

    await waitFor(() => {
      expect(mapInstances).toHaveLength(2)
    })

    await waitFor(() => {
      expect(clustererConfigs.length).toBeGreaterThan(clustererCountBeforeRemount)
      expect(clustererConfigs.at(-1)?.markers).toHaveLength(1)
    })
  })
})
