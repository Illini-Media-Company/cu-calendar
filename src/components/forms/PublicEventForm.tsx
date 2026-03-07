import { useMemo, useState, type FormEvent } from 'react'
import styles from '../../styles/App.module.css'

type FormVariant = 'submission' | 'change'

interface PublicEventFormProps {
  variant: FormVariant
  categories: string[]
  loading: boolean
  successMessage: string
  errorMessage: string
  onClose: () => void
  onResetStatus: () => void
  onSubmit: (payload: FormData) => Promise<boolean>
}

function headingForVariant(variant: FormVariant): string {
  return variant === 'submission' ? 'Submit an event' : 'Request an event change'
}

function endpointHintForVariant(variant: FormVariant): string {
  return variant === 'submission'
    ? 'All requests are reviewed by IMC before publishing.'
    : 'Change requests are reviewed before any event update is published.'
}

export function PublicEventForm({
  variant,
  categories,
  loading,
  successMessage,
  errorMessage,
  onClose,
  onResetStatus,
  onSubmit,
}: PublicEventFormProps) {
  const [formKey, setFormKey] = useState(0)
  const title = useMemo(() => headingForVariant(variant), [variant])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const formData = new FormData(formElement)

    formData.set('formType', variant)
    const succeeded = await onSubmit(formData)
    if (succeeded) {
      formElement.reset()
      setFormKey((previous) => previous + 1)
    }
  }

  return (
    <section className={styles.formSection} aria-live="polite">
      <div className={styles.formHeader}>
        <h2>{title}</h2>
        <button
          type="button"
          className={styles.inlineLinkButton}
          onClick={() => {
            onResetStatus()
            onClose()
          }}
        >
          Close
        </button>
      </div>

      <p className={styles.formHint}>{endpointHintForVariant(variant)}</p>

      <form key={formKey} className={styles.formGrid} onSubmit={handleSubmit}>
        {variant === 'change' ? (
          <label className={styles.formField}>
            <span>Event UID *</span>
            <input className={styles.input} name="eventUid" required />
          </label>
        ) : null}

        <label className={styles.formField}>
          <span>Event name *</span>
          <input className={styles.input} name="name" required />
        </label>

        <label className={styles.formField}>
          <span>Category *</span>
          <select className={styles.input} name="categoryType" required defaultValue="">
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.formField}>
          <span>Start date and time *</span>
          <input className={styles.input} type="datetime-local" name="startDate" required />
        </label>

        <label className={styles.formField}>
          <span>End date and time *</span>
          <input className={styles.input} type="datetime-local" name="endDate" required />
        </label>

        <label className={styles.formField}>
          <span>Address *</span>
          <input className={styles.input} name="address" required />
        </label>

        <label className={styles.formField}>
          <span>External URL</span>
          <input className={styles.input} name="url" type="url" placeholder="https://" />
        </label>

        <label className={`${styles.formField} ${styles.formFieldFull}`}>
          <span>Description *</span>
          <textarea className={styles.textarea} name="description" rows={4} required />
        </label>

        {variant === 'change' ? (
          <label className={`${styles.formField} ${styles.formFieldFull}`}>
            <span>Requested changes *</span>
            <textarea className={styles.textarea} name="requestedChanges" rows={3} required />
          </label>
        ) : null}

        <label className={styles.formField}>
          <span>Submitter name *</span>
          <input className={styles.input} name="submitterName" required />
        </label>

        <label className={styles.formField}>
          <span>Email *</span>
          <input className={styles.input} type="email" name="submitterEmail" required />
        </label>

        <label className={styles.formField}>
          <span>Organization *</span>
          <input className={styles.input} name="organization" required />
        </label>

        <label className={styles.formField}>
          <span>Image upload</span>
          <input className={styles.input} type="file" name="imageFile" accept="image/*" />
        </label>

        <div className={`${styles.formField} ${styles.formFieldFull}`}>
          <button className={`button-primary ${styles.primaryButton}`} type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit request'}
          </button>
        </div>

        {successMessage ? <p className={styles.successMessage}>{successMessage}</p> : null}
        {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}
      </form>
    </section>
  )
}
