const explicitMock = false

export const APP_CONFIG = {
  apiBaseUrl: 'https://app.dailyillini.com',
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
  googleMapsMapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? '',
  recaptchaSiteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? '',
  useMockApi: explicitMock,
  mapCenter: {
    lat: 40.1106,
    lng: -88.2073,
  },
  mapZoom: 12,
} as const

export const FALLBACK_CATEGORIES = [
  'Music',
  'Food',
  'Arts',
  'Sports',
  'Community',
  'Education',
]
