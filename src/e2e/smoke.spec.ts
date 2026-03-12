import { expect, test } from '@playwright/test'

test('loads app, toggles views, and submits event request', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'CU Calendar' })).toBeVisible()

  await page.getByRole('button', { name: 'Calendar' }).click()
  await expect(page.getByText('Calendar mode')).toBeVisible()

  await page.getByPlaceholder('Search title, location, or keyword').fill('Jazz')
  await expect(page.getByRole('button', { name: /Downtown Jazz Night/ }).first()).toBeVisible()

  await page.getByRole('button', { name: 'Submit Event' }).click()
  await expect(page.getByRole('heading', { name: 'Submit an event' })).toBeVisible()

  await page.getByLabel('Event name *').fill('Playwright Test Event')
  await page.getByLabel('Category *').selectOption('Music')
  await page.getByLabel('Start date and time *').fill('2026-03-19T19:00')
  await page.getByLabel('End date and time *').fill('2026-03-19T21:00')
  await page.getByLabel('Address *').fill('123 Main St, Champaign, IL')
  await page.getByLabel('Description *').fill('Automated smoke test event.')
  await page.getByLabel('Submitter name *').fill('Smoke Test')
  await page.getByLabel('Email *').fill('smoke@example.com')
  await page.getByLabel('Organization *').fill('IMC')

  await page.getByRole('button', { name: 'Submit request' }).click()
  await expect(page.getByText('Your event request was submitted for review.')).toBeVisible()
})
