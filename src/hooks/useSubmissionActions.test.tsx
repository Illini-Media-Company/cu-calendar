import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IMAGE_UPLOAD_LIMIT_MESSAGE, MAX_IMAGE_UPLOAD_BYTES } from '../utils/imageUpload'
import { useSubmissionActions } from './useSubmissionActions'

const mocked = vi.hoisted(() => ({
  submitEventRequest: vi.fn(),
}))

vi.mock('../api/client', () => ({
  createApiClient: () => ({
    submitEventRequest: mocked.submitEventRequest,
  }),
}))

describe('useSubmissionActions', () => {
  beforeEach(() => {
    mocked.submitEventRequest.mockReset()
  })

  it('submits the event payload directly', async () => {
    mocked.submitEventRequest.mockResolvedValue(undefined)

    const { result } = renderHook(() => useSubmissionActions())
    const payload = new FormData()
    payload.set('title', 'Event')

    await act(async () => {
      await result.current.submitEventRequest(payload)
    })

    expect(mocked.submitEventRequest).toHaveBeenCalledWith(payload)
    expect(result.current.submissionState.success).toContain('submitted')
  })

  it('stores error state when event submission fails', async () => {
    mocked.submitEventRequest.mockRejectedValue(new Error('Nope'))

    const { result } = renderHook(() => useSubmissionActions())

    await act(async () => {
      await result.current.submitEventRequest(new FormData())
    })

    expect(result.current.submissionState.error).toBe('Nope')
  })

  it('rejects oversized image uploads before API submission', async () => {
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

    expect(mocked.submitEventRequest).not.toHaveBeenCalled()
    expect(result.current.submissionState.error).toBe(IMAGE_UPLOAD_LIMIT_MESSAGE)
  })
})
