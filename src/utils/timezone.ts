const CENTRAL_TZ = 'America/Chicago'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CENTRAL_TZ,
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CENTRAL_TZ,
  hour: 'numeric',
  minute: '2-digit',
})

export function formatCentralDateTime(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.valueOf())) {
    return 'TBD'
  }

  return `${dateFormatter.format(date)} ${timeFormatter.format(date)} CT`
}

export function formatCentralRange(startIso: string, endIso: string): string {
  const start = new Date(startIso)
  const end = new Date(endIso)

  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
    return 'TBD'
  }

  const sameDay =
    start.toLocaleDateString('en-US', { timeZone: CENTRAL_TZ }) ===
    end.toLocaleDateString('en-US', { timeZone: CENTRAL_TZ })

  if (sameDay) {
    return `${dateFormatter.format(start)} ${timeFormatter.format(start)} - ${timeFormatter.format(end)} CT`
  }

  return `${formatCentralDateTime(startIso)} - ${formatCentralDateTime(endIso)}`
}

export function toCalendarDate(isoDate: string): Date {
  return new Date(isoDate)
}

export function getCentralTimezoneLabel(): string {
  return CENTRAL_TZ
}
