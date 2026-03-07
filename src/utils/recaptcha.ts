import { APP_CONFIG } from '../config'

declare global {
  interface Window {
    grecaptcha?: {
      ready(callback: () => void): void
      execute(siteKey: string, options: { action: string }): Promise<string>
    }
  }
}

let scriptPromise: Promise<void> | null = null

function ensureRecaptchaScript(siteKey: string): Promise<void> {
  if (window.grecaptcha) {
    return Promise.resolve()
  }

  if (scriptPromise) {
    return scriptPromise
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[data-recaptcha="true"]',
    ) as HTMLScriptElement | null

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load reCAPTCHA')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
    script.async = true
    script.defer = true
    script.dataset.recaptcha = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA'))

    document.head.appendChild(script)
  })

  return scriptPromise
}

export async function getRecaptchaToken(action: string): Promise<string> {
  if (APP_CONFIG.useMockApi) {
    return 'mock-recaptcha-token'
  }

  const siteKey = APP_CONFIG.recaptchaSiteKey

  if (!siteKey) {
    throw new Error('Missing reCAPTCHA site key configuration.')
  }

  await ensureRecaptchaScript(siteKey)

  if (!window.grecaptcha) {
    throw new Error('reCAPTCHA unavailable')
  }

  return new Promise((resolve, reject) => {
    window.grecaptcha?.ready(() => {
      window.grecaptcha
        ?.execute(siteKey, { action })
        .then((token) => resolve(token))
        .catch(() => reject(new Error('Failed to execute reCAPTCHA')))
    })
  })
}
