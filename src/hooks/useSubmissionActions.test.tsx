import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IMAGE_UPLOAD_LIMIT_MESSAGE, MAX_IMAGE_UPLOAD_BYTES } from '../utils/imageUpload'
import { useSubmissionActions } from './useSubmissionActions'

const mocked = vi.hoisted(() => ({
  submitEventRequest: vi.fn(),
  getRecaptchaToken: vi.fn(),
}))

vi.mock('../api/client', () => ({
  createApiClient: () => ({
    submitEventRequest: mocked.submitEventRequest,
  }),
}))

vi.mock('../utils/recaptcha', () => ({
  getRecaptchaToken: mocked.getRecaptchaToken,
}))

describe('useSubmissionActions', () => {
  beforeEach(() => {
    mocked.submitEventRequest.mockReset()
    mocked.getRecaptchaToken.mockReset()
  })

  it('appends recaptcha token before event submission', async () => {
    mocked.getRecaptchaToken.mockResolvedValue('token-1')
    mocked.submitEventRequest.mockResolvedValue(undefined)

    const { result } = renderHook(() => useSubmissionActions())
    const payload = new FormData()
    payload.set('title', 'Event')

    await act(async () => {
      await result.current.submitEventRequest(payload)
    })

    expect(mocked.getRecaptchaToken).toHaveBeenCalledWith('event_submission')
    expect(payload.get('recaptcha_token')).toBe('token-1')
    expect(mocked.submitEventRequest).toHaveBeenCalledWith(payload)
    expect(result.current.submissionState.success).toContain('submitted')
  })

  it('stores error state when event submission fails', async () => {
    mocked.getRecaptchaToken.mockResolvedValue('token-2')
    mocked.submitEventRequest.mockRejectedValue(new Error('Nope'))

    const { result } = renderHook(() => useSubmissionActions())

    await act(async () => {
      await result.current.submitEventRequest(new FormData())
    })

    expect(result.current.submissionState.error).toBe('Nope')
  })

  it('rejects oversized image uploads before recaptcha or API submission', async () => {
    const { result } = renderHook(() => useSubmissionActions())
    const payload = new FormData()
    payload.set(
      'image_file',
      new File(['x'.repeat(MAX_IMAGE_UPLOAD_BYTES + 1)], 'poster.png', {
        type: 'image/png',
      }),
    )

    await act(async () => {
      await result.current.submitEventRequest(payload)
    })

    expect(mocked.getRecaptchaToken).not.toHaveBeenCalled()
    expect(mocked.submitEventRequest).not.toHaveBeenCalled()
    expect(result.current.submissionState.error).toBe(IMAGE_UPLOAD_LIMIT_MESSAGE)
  })
})
