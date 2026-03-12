import { APP_CONFIG } from '../config'

declare global {
  interface Window {
    google?: typeof google
    __cuCalendarGoogleMapsInit?: () => void
    gm_authFailure?: () => void
  }
}

let googleMapsPromise: Promise<typeof google> | null = null

function buildAuthFailureMessage(): string {
  const origin = window.location.origin

  if (origin.startsWith('http')) {
    return `Google Maps API key is not authorized for ${origin}/. Add ${origin}/* to the key's allowed HTTP referrers.`
  }

  return 'Google Maps API key is not authorized for this origin. Update the key\'s allowed HTTP referrers.'
}

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
    let script = existingScript
    let settled = false

    const cleanup = () => {
      if (window[callbackName]) {
        delete window[callbackName]
      }

      if (window.gm_authFailure === handleAuthFailure) {
        delete window.gm_authFailure
      }

      existingScript?.removeEventListener('error', handleScriptError)
      if (script) {
        script.onerror = null
      }
    }

    const resolveGoogleMaps = () => {
      if (settled) {
        return
      }

      settled = true

      if (script) {
        script.dataset.loaded = 'true'
        delete script.dataset.authFailed
      }

      cleanup()
      resolve(window.google)
    }

    const rejectGoogleMaps = (message: string) => {
      if (settled) {
        return
      }

      settled = true
      googleMapsPromise = null

      if (script) {
        script.dataset.authFailed = 'true'
      }

      cleanup()
      reject(new Error(message))
    }

    const handleAuthFailure = () => {
      rejectGoogleMaps(buildAuthFailureMessage())
    }

    const handleScriptError = () => {
      rejectGoogleMaps('Google Maps failed to load.')
    }

    window[callbackName] = () => {
      resolveGoogleMaps()
    }
    window.gm_authFailure = handleAuthFailure

    if (existingScript) {
      if (existingScript.dataset.authFailed === 'true') {
        rejectGoogleMaps(buildAuthFailureMessage())
        return
      }

      if (existingScript.dataset.loaded === 'true' && window.google) {
        resolveGoogleMaps()
        return
      }

      existingScript.addEventListener('error', handleScriptError, { once: true })
      return
    }

    script = document.createElement('script')
    script.dataset.googleMaps = 'true'
    script.async = true
    script.defer = true
    script.src =
      'https://maps.googleapis.com/maps/api/js' +
      `?key=${encodeURIComponent(apiKey)}` +
      '&loading=async&v=weekly&libraries=marker' +
      `&callback=${callbackName}`
    script.onerror = handleScriptError

    document.head.appendChild(script)
  })

  return googleMapsPromise
}
