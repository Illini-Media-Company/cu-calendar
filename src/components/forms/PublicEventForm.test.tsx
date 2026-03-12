import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IMAGE_UPLOAD_LIMIT_MESSAGE, MAX_IMAGE_UPLOAD_BYTES } from '../../utils/imageUpload'

vi.mock('../../config', () => ({
  APP_CONFIG: {
    apiBaseUrl: '',
    googleMapsApiKey: '',
    googleMapsMapId: '',
    recaptchaSiteKey: '',
    useMockApi: true,
    mapCenter: { lat: 40.1106, lng: -88.2073 },
    mapZoom: 12,
  },
}))

import { PublicEventForm } from './PublicEventForm'

const categories = ['Music', 'Food']

describe('PublicEventForm', () => {
  afterEach(() => {
    cleanup()
  })

  it('collects required submission fields and emits multipart payload', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(true)

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

    await user.type(screen.getByLabelText('Event name *'), 'Jazz Night')
    await user.selectOptions(screen.getByLabelText('Category *'), 'Music')
    await user.type(screen.getByLabelText('Start date and time *'), '2026-03-12T19:00')
    await user.type(screen.getByLabelText('End date and time *'), '2026-03-12T21:00')
    await user.type(screen.getByLabelText('Address *'), 'Main St')
    await user.type(screen.getByLabelText('Description *'), 'A show')
    await user.type(screen.getByLabelText('Submitter name *'), 'Alex')
    await user.type(screen.getByLabelText('Email *'), 'alex@example.com')
    await user.type(screen.getByLabelText('Organization *'), 'IMC')

    await user.click(screen.getByRole('button', { name: 'Submit request' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const payload = onSubmit.mock.calls[0][0] as FormData
    expect(payload.get('title')).toBe('Jazz Night')
    expect(payload.get('event_type')).toBe('Music')
    expect(payload.get('company_name')).toBe('IMC')
    expect(payload.get('form_type')).toBe('submission')
  })

  it('renders submission-only fields', () => {
    render(
      <PublicEventForm
        categories={categories}
        loading={false}
        successMessage=""
        errorMessage=""
        onClose={() => undefined}
        onResetStatus={() => undefined}
        onSubmit={vi.fn().mockResolvedValue(true)}
      />,
    )

    expect(screen.getByText('Submit an event')).toBeInTheDocument()
    expect(screen.queryByLabelText('Event UID *')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Requested changes *')).not.toBeInTheDocument()
  })

  it('blocks image uploads larger than 10 MB before submit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(true)

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

    await user.type(screen.getByLabelText('Event name *'), 'Jazz Night')
    await user.selectOptions(screen.getByLabelText('Category *'), 'Music')
    await user.type(screen.getByLabelText('Start date and time *'), '2026-03-12T19:00')
    await user.type(screen.getByLabelText('End date and time *'), '2026-03-12T21:00')
    await user.type(screen.getByLabelText('Address *'), 'Main St')
    await user.type(screen.getByLabelText('Description *'), 'A show')
    await user.type(screen.getByLabelText('Submitter name *'), 'Alex')
    await user.type(screen.getByLabelText('Email *'), 'alex@example.com')
    await user.type(screen.getByLabelText('Organization *'), 'IMC')
    await user.upload(
      screen.getByLabelText('Image upload'),
      new File(['x'.repeat(MAX_IMAGE_UPLOAD_BYTES + 1)], 'poster.png', {
        type: 'image/png',
      }),
    )

    await user.click(screen.getByRole('button', { name: 'Submit request' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText(IMAGE_UPLOAD_LIMIT_MESSAGE)).toBeInTheDocument()
  })
})
