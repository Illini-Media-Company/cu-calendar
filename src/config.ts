const explicitMock = import.meta.env.VITE_USE_MOCK_API

export const APP_CONFIG = {
  apiBaseUrl: import.meta.env.VITE_EVENTS_API_BASE ?? '',
  recaptchaSiteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? '',
  useMockApi:
    explicitMock === 'true' ||
    (typeof explicitMock === 'undefined' && import.meta.env.MODE !== 'production'),
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
