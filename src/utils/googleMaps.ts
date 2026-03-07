import { APP_CONFIG } from '../config'

declare global {
  interface Window {
    google?: typeof google
    __cuCalendarGoogleMapsInit?: () => void
  }
}

let googleMapsPromise: Promise<typeof google> | null = null

export function loadGoogleMaps(): Promise<typeof google> {
  const loadedGoogle = window.google
  const loadedScript = document.querySelector(
    'script[data-google-maps="true"][data-loaded="true"]',
  )

  if (loadedGoogle && loadedScript) {
    return Promise.resolve(loadedGoogle)
  }

  if (googleMapsPromise) {
    return googleMapsPromise
  }

  const apiKey = APP_CONFIG.googleMapsApiKey

  if (!apiKey) {
    return Promise.reject(
      new Error('Set VITE_GOOGLE_MAPS_API_KEY to render the Google map.'),
    )
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = '__cuCalendarGoogleMapsInit'
    const existingScript = document.querySelector(
      'script[data-google-maps="true"]',
    ) as HTMLScriptElement | null

    window[callbackName] = () => {
      const loadedGoogleScript = document.querySelector(
        'script[data-google-maps="true"]',
      ) as HTMLScriptElement | null

      if (loadedGoogleScript) {
        loadedGoogleScript.dataset.loaded = 'true'
      }
      resolve(window.google)
      delete window[callbackName]
    }

    if (existingScript) {
      if (existingScript.dataset.loaded === 'true' && window.google) {
        resolve(window.google)
        delete window[callbackName]
        return
      }

      existingScript.addEventListener('error', () => {
        reject(new Error('Google Maps failed to load.'))
      })
      return
    }

    const script = document.createElement('script')
    script.dataset.googleMaps = 'true'
    script.async = true
    script.defer = true
    script.src =
      'https://maps.googleapis.com/maps/api/js' +
      `?key=${encodeURIComponent(apiKey)}` +
      '&loading=async&v=weekly&libraries=marker' +
      `&callback=${callbackName}`
    script.onerror = () => {
      reject(new Error('Google Maps failed to load.'))
    }

    document.head.appendChild(script)
  })

  return googleMapsPromise
}
