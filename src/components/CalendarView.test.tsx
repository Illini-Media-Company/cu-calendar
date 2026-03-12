import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CalendarView } from './CalendarView'
import { MOCK_EVENTS } from '../mocks/events'
import type { CalendarEvent } from '../types/events'

describe('CalendarView', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('updates the visible month when navigating from the toolbar', async () => {
    const user = userEvent.setup()

    const { container } = render(
      <CalendarView
        events={MOCK_EVENTS}
        mode="month"
        onModeChange={() => undefined}
        onSelectEvent={() => undefined}
      />,
    )

    const label = container.querySelector('.rbc-toolbar-label')
    expect(label).not.toBeNull()

    const initialLabel = label?.textContent
    expect(initialLabel).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() => {
      expect(label?.textContent).not.toBe(initialLabel)
    })
  })

  it('does not render the duplicate built-in month and agenda buttons', () => {
    render(
      <CalendarView
        events={MOCK_EVENTS}
        mode="month"
        onModeChange={() => undefined}
        onSelectEvent={() => undefined}
      />,
    )

    expect(screen.getByRole('button', { name: 'Month' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'List' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Agenda' })).not.toBeInTheDocument()
  })

  it('shows list mode as the current visible month only', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15T12:00:00Z'))

    const monthEvents: CalendarEvent[] = [
      {
        uid: 'evt-mar',
        title: 'March Event',
        description: '',
        event_type: 'Music',
        highlight: true,
        start_date: '2026-03-20T19:00:00Z',
        end_date: '2026-03-20T21:00:00Z',
        address: 'March Venue',
        images: [],
      },
      {
        uid: 'evt-apr',
        title: 'April Event',
        description: '',
        event_type: 'Music',
        highlight: false,
        start_date: '2026-04-02T19:00:00Z',
        end_date: '2026-04-02T21:00:00Z',
        address: 'April Venue',
        images: [],
      },
    ]

    const { container } = render(
      <CalendarView
        events={monthEvents}
        mode="list"
        onModeChange={() => undefined}
        onSelectEvent={() => undefined}
      />,
    )

    expect(container.querySelector('.rbc-toolbar-label')?.textContent).toBe('March 2026')
    expect(screen.getByText('March Event')).toBeInTheDocument()
    expect(screen.getByText('Featured')).toBeInTheDocument()
    expect(screen.queryByText('April Event')).not.toBeInTheDocument()
  })

  it('greys out past items in list mode', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15T12:00:00Z'))

    const listEvents: CalendarEvent[] = [
      {
        uid: 'evt-past',
        title: 'Past Event',
        description: '',
        event_type: 'Music',
        highlight: true,
        start_date: '2026-03-10T19:00:00Z',
        end_date: '2026-03-10T21:00:00Z',
        address: 'Past Venue',
        images: [],
      },
      {
        uid: 'evt-upcoming',
        title: 'Upcoming Event',
        description: '',
        event_type: 'Music',
        highlight: false,
        start_date: '2026-03-20T19:00:00Z',
        end_date: '2026-03-20T21:00:00Z',
        address: 'Upcoming Venue',
        images: [],
      },
    ]

    render(
      <CalendarView
        events={listEvents}
        mode="list"
        onModeChange={() => undefined}
        onSelectEvent={() => undefined}
      />,
    )

    const pastRow = screen.getByText('Past Event').closest('tr')
    const upcomingRow = screen.getByText('Upcoming Event').closest('tr')

    expect(pastRow).toHaveStyle({ opacity: '0.55' })
    expect(upcomingRow).not.toHaveStyle({ opacity: '0.55' })
    expect(upcomingRow?.getAttribute('style')).toContain('background')
  })

  it('renders featured events ahead of standard events in month mode for the same day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15T12:00:00Z'))

    const monthEvents: CalendarEvent[] = [
      {
        uid: 'evt-standard',
        title: 'Standard Event',
        description: '',
        event_type: 'Music',
        highlight: false,
        start_date: '2026-03-20T19:00:00Z',
        end_date: '2026-03-20T21:00:00Z',
        address: 'Venue',
        images: [],
      },
      {
        uid: 'evt-featured',
        title: 'Priority Showcase',
        description: '',
        event_type: 'Arts',
        highlight: true,
        start_date: '2026-03-20T20:00:00Z',
        end_date: '2026-03-20T22:00:00Z',
        address: 'Venue',
        images: [],
      },
    ]

    const { container } = render(
      <CalendarView
        events={monthEvents}
        mode="month"
        onModeChange={() => undefined}
        onSelectEvent={() => undefined}
      />,
    )

    const renderedEvents = Array.from(container.querySelectorAll('.rbc-event'))
    expect(renderedEvents).toHaveLength(2)

    expect(renderedEvents[0]).toHaveTextContent('Priority Showcase')
    expect(within(renderedEvents[0] as HTMLElement).getByLabelText('Featured event')).toBeInTheDocument()
    expect(within(renderedEvents[0] as HTMLElement).queryByText('Featured')).not.toBeInTheDocument()
    expect(renderedEvents[1]).toHaveTextContent('Standard Event')
  })

  it('keeps the full event name available on hover in month mode', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15T12:00:00Z'))

    const longTitle =
      'A Very Long Featured Event Name That Still Needs To Be Discoverable In Month View'

    const monthEvents: CalendarEvent[] = [
      {
        uid: 'evt-long',
        title: longTitle,
        description: '',
        event_type: 'Music',
        highlight: true,
        start_date: '2026-03-20T19:00:00Z',
        end_date: '2026-03-20T21:00:00Z',
        address: 'Venue',
        images: [],
      },
    ]

    const { container } = render(
      <CalendarView
        events={monthEvents}
        mode="month"
        onModeChange={() => undefined}
        onSelectEvent={() => undefined}
      />,
    )

    const eventContent = container.querySelector('.rbc-event-content')
    expect(eventContent).not.toBeNull()
    expect(eventContent).toHaveAttribute('title', longTitle)
    expect(within(eventContent as HTMLElement).getByLabelText('Featured event')).toBeInTheDocument()
  })
})
