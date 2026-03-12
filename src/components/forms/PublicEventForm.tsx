import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  IMAGE_UPLOAD_LIMIT_MESSAGE,
  MAX_IMAGE_UPLOAD_LABEL,
  MAX_IMAGE_UPLOAD_BYTES,
} from '../../utils/imageUpload'
import styles from '../../styles/App.module.css'

interface PublicEventFormProps {
  categories: string[]
  loading: boolean
  successMessage: string
  errorMessage: string
  onClose: () => void
  onResetStatus: () => void
  onSubmit: (payload: FormData) => Promise<boolean>
}

export function PublicEventForm({
  categories,
  loading,
  successMessage,
  errorMessage,
  onClose,
  onResetStatus,
  onSubmit,
}: PublicEventFormProps) {
  const [formKey, setFormKey] = useState(0)
  const [localError, setLocalError] = useState('')
  const title = useMemo(() => 'Submit an event', [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError('')
    onResetStatus()
    const formElement = event.currentTarget
    const imageInput = formElement.elements.namedItem('image_file')
    const formData = new FormData(formElement)
    const imageFile =
      imageInput instanceof HTMLInputElement ? imageInput.files?.[0] ?? null : null

    if (imageFile && imageFile.size > MAX_IMAGE_UPLOAD_BYTES) {
      setLocalError(IMAGE_UPLOAD_LIMIT_MESSAGE)
      return
    }

    formData.set('form_type', 'submission')
    const succeeded = await onSubmit(formData)
    if (succeeded) {
      formElement.reset()
      setFormKey((previous) => previous + 1)
      setLocalError('')
    }
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    onResetStatus()
    const imageFile = event.currentTarget.files?.[0]

    if (imageFile && imageFile.size > MAX_IMAGE_UPLOAD_BYTES) {
      setLocalError(IMAGE_UPLOAD_LIMIT_MESSAGE)
      return
    }

    setLocalError('')
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

      <p className={styles.formHint}>All requests are reviewed by IMC before publishing.</p>

      <form key={formKey} className={styles.formGrid} onSubmit={handleSubmit}>
        <label className={styles.formField}>
          <span>Event name *</span>
          <input className={styles.input} name="title" required />
        </label>

        <label className={styles.formField}>
          <span>Category *</span>
          <select className={styles.input} name="event_type" required defaultValue="">
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
          <input className={styles.input} type="datetime-local" name="start_date" required />
        </label>

        <label className={styles.formField}>
          <span>End date and time *</span>
          <input className={styles.input} type="datetime-local" name="end_date" required />
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

        <label className={styles.formField}>
          <span>Submitter name *</span>
          <input className={styles.input} name="submitter_name" required />
        </label>

        <label className={styles.formField}>
          <span>Email *</span>
          <input className={styles.input} type="email" name="submitter_email" required />
        </label>

        <label className={styles.formField}>
          <span>Organization *</span>
          <input className={styles.input} name="company_name" required />
        </label>

        <div className={styles.formField}>
          <label htmlFor="image_file">Image upload</label>
          <input
            id="image_file"
            className={styles.input}
            type="file"
            name="image_file"
            accept="image/*"
            onChange={handleImageChange}
            aria-describedby="imageFileHint"
          />
          <span id="imageFileHint" className={styles.formFieldHint}>
            Max file size: {MAX_IMAGE_UPLOAD_LABEL}
          </span>
        </div>

        <div className={`${styles.formField} ${styles.formFieldFull}`}>
          <button className={`button-primary ${styles.primaryButton}`} type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit request'}
          </button>
        </div>

        {successMessage ? <p className={styles.successMessage}>{successMessage}</p> : null}
        {localError || errorMessage ? (
          <p className={styles.errorMessage}>{localError || errorMessage}</p>
        ) : null}
      </form>
    </section>
  )
}
