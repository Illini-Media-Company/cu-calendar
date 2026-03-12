# CU Calendar

Public-facing Champaign-Urbana event frontend for Illini Media Company. This repo provides an iframe-friendly React + Vite app with synchronized map + calendar views and public event request forms.

## Features

- Map-first experience with Google Maps and promoted featured-event markers
- Calendar month/list views powered by React Big Calendar
- Featured paid-event promotion across map, calendar, list, and detail surfaces
- Bootstrap Icons-powered category system shared across map markers, calendar events, and badges
- Shared filters via URL query state (`view`, `category`, `start`, `end`, `q`, `event`)
- Event detail panel (title, time range, category, location, description, link/image)
- Public event submission form (multipart + reCAPTCHA token)
- Typed API adapter with mock mode for frontend-first development
- iframe auto-resize messaging with fallback contract

## Local Development

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173/`.

## Environment Variables

Use a local `.env.local` file for environment configuration.

- `VITE_USE_MOCK_API`: `true|false`
- `VITE_EVENTS_API_BASE`: backend base URL (blank means same-origin)
- `VITE_GOOGLE_MAPS_API_KEY`: browser Google Maps JavaScript API key
  - For local dev, authorize `http://localhost:5173/*` and `http://localhost:5000/*` in the key's HTTP referrer restrictions.
- `VITE_GOOGLE_MAPS_MAP_ID`: optional Google Maps map ID for custom styling
- `VITE_RECAPTCHA_SITE_KEY`: public reCAPTCHA v3 site key

Behavior default:

- dev/test: mock API enabled unless explicitly overridden
- production build: mock API disabled unless explicitly set

## API Contract (frontend expectations)

- `GET /api/events`
  - query params: `category`, `start`, `end`, `q`
  - returns array of events
- `GET /api/events/categories`
  - returns string array
- `POST /api/events/submissions`
  - multipart form request with event + submitter fields + optional image

### Event shape expected by frontend

```ts
{
  uid: string
  name: string
  description: string
  categoryType: string
  isFeatured?: boolean
  startDate: string
  endDate: string
  address: string
  lat?: number | null
  long?: number | null
  url?: string | null
  image?: string | null
}
```

## Scripts

- `npm run dev`: start Vite dev server
- `npm run lint`: ESLint checks
- `npm run typecheck`: TypeScript project checks
- `npm run test`: Vitest unit/integration tests with coverage
- `npm run test:e2e`: Playwright smoke test
- `npm run build`: production build for GitHub Pages
- `npm run ci`: local CI parity (lint + typecheck + test + build)

Playwright setup (first run):

```bash
npx playwright install
```

## Iframe Resize Contract

Frontend posts resize messages to parent window:

```json
{ "type": "imc:iframe:resize", "source": "cu-calendar", "height": 1234 }
```

Also posts legacy fallback:

```json
{ "type": "iframe:resize", "source": "cu-calendar", "height": 1234 }
```

## GitHub Pages

The dev server runs from `/`, while preview/build use the `/cu-calendar/` base path for GitHub Pages deployment.
