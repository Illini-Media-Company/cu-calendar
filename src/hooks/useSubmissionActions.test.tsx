import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSubmissionActions } from './useSubmissionActions'

const mocked = vi.hoisted(() => ({
  submitEventRequest: vi.fn(),
  submitChangeRequest: vi.fn(),
  getRecaptchaToken: vi.fn(),
}))

vi.mock('../api/client', () => ({
  createApiClient: () => ({
    submitEventRequest: mocked.submitEventRequest,
    submitChangeRequest: mocked.submitChangeRequest,
  }),
}))

vi.mock('../utils/recaptcha', () => ({
  getRecaptchaToken: mocked.getRecaptchaToken,
}))

describe('useSubmissionActions', () => {
  beforeEach(() => {
    mocked.submitEventRequest.mockReset()
    mocked.submitChangeRequest.mockReset()
    mocked.getRecaptchaToken.mockReset()
  })

  it('appends recaptcha token before event submission', async () => {
    mocked.getRecaptchaToken.mockResolvedValue('token-1')
    mocked.submitEventRequest.mockResolvedValue(undefined)

    const { result } = renderHook(() => useSubmissionActions())
    const payload = new FormData()
    payload.set('name', 'Event')

    await act(async () => {
      await result.current.submitEventRequest(payload)
    })

    expect(mocked.getRecaptchaToken).toHaveBeenCalledWith('event_submission')
    expect(payload.get('recaptchaToken')).toBe('token-1')
    expect(mocked.submitEventRequest).toHaveBeenCalledWith(payload)
    expect(result.current.submissionState.success).toContain('submitted')
  })

  it('stores error state when change request fails', async () => {
    mocked.getRecaptchaToken.mockResolvedValue('token-2')
    mocked.submitChangeRequest.mockRejectedValue(new Error('Nope'))

    const { result } = renderHook(() => useSubmissionActions())

    await act(async () => {
      await result.current.submitChangeRequest(new FormData())
    })

    expect(result.current.submissionState.error).toBe('Nope')
  })
})
