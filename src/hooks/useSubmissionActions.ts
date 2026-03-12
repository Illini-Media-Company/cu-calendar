import { useCallback, useState } from 'react'
import { createApiClient } from '../api/client'
import { validateImageUpload } from '../utils/imageUpload'
import { getRecaptchaToken } from '../utils/recaptcha'

interface SubmissionState {
  loading: boolean
  error: string
  success: string
}

const INITIAL_STATE: SubmissionState = {
  loading: false,
  error: '',
  success: '',
}

function appendRecaptcha(formData: FormData, token: string) {
  formData.set('recaptcha_token', token)
}

export function useSubmissionActions() {
  const [submissionState, setSubmissionState] = useState<SubmissionState>(INITIAL_STATE)
  const client = createApiClient()

  const submitEventRequest = useCallback(
    async (payload: FormData) => {
      setSubmissionState({ loading: true, error: '', success: '' })

      try {
        validateImageUpload(payload)
        const token = await getRecaptchaToken('event_submission')
        appendRecaptcha(payload, token)
        await client.submitEventRequest(payload)

        setSubmissionState({
          loading: false,
          error: '',
          success: 'Your event request was submitted for review.',
        })
        return true
      } catch (error) {
        setSubmissionState({
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Unable to submit event request at this time.',
          success: '',
        })
        return false
      }
    },
    [client],
  )

  const resetSubmissionState = useCallback(() => {
    setSubmissionState(INITIAL_STATE)
  }, [])

  return {
    submissionState,
    submitEventRequest,
    resetSubmissionState,
  }
}
