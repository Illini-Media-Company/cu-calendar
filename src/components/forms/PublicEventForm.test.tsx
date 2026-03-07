import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PublicEventForm } from './PublicEventForm'

const categories = ['Music', 'Food']

describe('PublicEventForm', () => {
  it('collects required submission fields and emits multipart payload', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(true)

    render(
      <PublicEventForm
        variant="submission"
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
    expect(payload.get('name')).toBe('Jazz Night')
    expect(payload.get('categoryType')).toBe('Music')
    expect(payload.get('organization')).toBe('IMC')
    expect(payload.get('formType')).toBe('submission')
  })

  it('requires event uid and requested changes for change requests', () => {
    render(
      <PublicEventForm
        variant="change"
        categories={categories}
        loading={false}
        successMessage=""
        errorMessage=""
        onClose={() => undefined}
        onResetStatus={() => undefined}
        onSubmit={vi.fn().mockResolvedValue(true)}
      />,
    )

    expect(screen.getByLabelText('Event UID *')).toBeRequired()
    expect(screen.getByLabelText('Requested changes *')).toBeRequired()
  })
})
