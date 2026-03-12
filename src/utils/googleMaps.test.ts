import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

async function importGoogleMapsModule(apiKey: string) {
  vi.resetModules()
  vi.doMock('../config', () => ({
    APP_CONFIG: {
      googleMapsApiKey: apiKey,
    },
  }))

  return import('./googleMaps')
}

function resetGoogleMapsGlobals() {
  Reflect.deleteProperty(window, 'google')
  Reflect.deleteProperty(window, '__cuCalendarGoogleMapsInit')
  Reflect.deleteProperty(window, 'gm_authFailure')
}

describe('googleMaps loader', () => {
  beforeEach(() => {
    document.head
      .querySelectorAll('script[data-google-maps="true"]')
      .forEach((script) => script.remove())
    resetGoogleMapsGlobals()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
    vi.unmock('../config')
    document.head
      .querySelectorAll('script[data-google-maps="true"]')
      .forEach((script) => script.remove())
    resetGoogleMapsGlobals()
  })

  it('rejects with a helpful localhost message when Google auth fails', async () => {
    const { loadGoogleMaps } = await importGoogleMapsModule('test-key')
    const origin = window.location.origin

    const loadPromise = loadGoogleMaps()
    window.gm_authFailure?.()

    await expect(loadPromise).rejects.toThrow(
      `Google Maps API key is not authorized for ${origin}/. Add ${origin}/* to the key's allowed HTTP referrers.`,
    )
  })

  it('rejects immediately when the API key is missing', async () => {
    const { loadGoogleMaps } = await importGoogleMapsModule('')

    await expect(loadGoogleMaps()).rejects.toThrow(
      'Set VITE_GOOGLE_MAPS_API_KEY to render the Google map.',
    )
  })
})
