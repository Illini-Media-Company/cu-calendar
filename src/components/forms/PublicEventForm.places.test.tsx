import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

const categories = ['Music', 'Food']

const mockedPlaces = vi.hoisted(() => {
  let selectedPlace: { formatted_address?: string; name?: string; place_id?: string } | null = null
  let placeChangedCallback: (() => void) | null = null

  const listenerRemove = vi.fn()
  const importLibrary = vi.fn().mockResolvedValue({
    Autocomplete: class {
      constructor() {}

      addListener(...args: [string, () => void]) {
        placeChangedCallback = args[1]
        return { remove: listenerRemove }
      }

      getPlace() {
        return selectedPlace
      }
    },
  })
  const loadGoogleMaps = vi.fn().mockResolvedValue({
    maps: {
      importLibrary,
    },
  })

  return {
    loadGoogleMaps,
    importLibrary,
    listenerRemove,
    setSelectedPlace(place: { formatted_address?: string; name?: string; place_id?: string } | null) {
      selectedPlace = place
    },
    triggerPlaceChanged() {
      placeChangedCallback?.()
    },
    reset() {
      selectedPlace = null
      placeChangedCallback = null
      listenerRemove.mockReset()
      importLibrary.mockClear()
      loadGoogleMaps.mockClear()
    },
  }
})

vi.mock('../../config', () => ({
  APP_CONFIG: {
    apiBaseUrl: '',
    googleMapsApiKey: 'test-key',
    googleMapsMapId: '',
    recaptchaSiteKey: '',
    useMockApi: true,
    mapCenter: { lat: 40.1106, lng: -88.2073 },
    mapZoom: 12,
  },
}))

vi.mock('../../utils/googleMaps', () => ({
  loadGoogleMaps: mockedPlaces.loadGoogleMaps,
}))

import { PublicEventForm } from './PublicEventForm'

function renderForm(onSubmit = vi.fn().mockResolvedValue(true)) {
  render(
    <PublicEventForm
      categories={categories}
      loading={false}
      successMessage=""
      errorMessage=""
      onClose={() => undefined}
      onResetStatus={() => undefined}
      onSubmit={onSubmit}
    />,
  )

  return { onSubmit }
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Event name *'), 'Jazz Night')
  await user.selectOptions(screen.getByLabelText('Category *'), 'Music')
  await user.type(screen.getByLabelText('Start date and time *'), '2026-03-12T19:00')
  await user.type(screen.getByLabelText('End date and time *'), '2026-03-12T21:00')
  await user.type(screen.getByLabelText('Address *'), '123 Main')
  await user.type(screen.getByLabelText('Description *'), 'A show')
  await user.type(screen.getByLabelText('Submitter name *'), 'Alex')
  await user.type(screen.getByLabelText('Email *'), 'alex@example.com')
  await user.type(screen.getByLabelText('Organization *'), 'IMC')
}

describe('PublicEventForm Google Places integration', () => {
  afterEach(() => {
    cleanup()
    mockedPlaces.reset()
  })

  it('blocks submit until a Google suggestion has been chosen', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await fillRequiredFields(user)
    await waitFor(() => expect(mockedPlaces.loadGoogleMaps).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(
        screen.getByText('Start typing and choose a Google Maps suggestion.'),
      ).toBeInTheDocument(),
    )

    await user.click(screen.getByRole('button', { name: 'Submit request' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(
      screen.getByText('Choose an address from the Google suggestions before submitting.'),
    ).toBeInTheDocument()
  })

  it('submits the formatted Google address and place_id after selection', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await fillRequiredFields(user)
    await waitFor(() => expect(mockedPlaces.loadGoogleMaps).toHaveBeenCalledTimes(1))

    await act(async () => {
      mockedPlaces.setSelectedPlace({
        formatted_address: '123 Main St, Champaign, IL 61820, USA',
        place_id: 'place-123',
      })
      mockedPlaces.triggerPlaceChanged()
    })

    await user.click(screen.getByRole('button', { name: 'Submit request' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const payload = onSubmit.mock.calls[0][0] as FormData
    expect(payload.get('address')).toBe('123 Main St, Champaign, IL 61820, USA')
    expect(payload.get('place_id')).toBe('place-123')
  })
})
