import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { APP_CONFIG } from '../../config'
import { loadGoogleMaps } from '../../utils/googleMaps'
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

type AddressAutocompleteStatus = 'disabled' | 'loading' | 'ready' | 'error'

interface SelectedPlace {
  formattedAddress: string
  placeId: string
}

const ADDRESS_SELECTION_ERROR = 'Choose an address from the Google suggestions before submitting.'
const ADDRESS_LOADING_ERROR = 'Google address suggestions are still loading. Please wait a moment.'
const ADDRESS_UNAVAILABLE_ERROR = 'Google address suggestions are unavailable right now. Please try again later.'
const ADDRESS_AUTOCOMPLETE_HINT = 'Start typing and choose a Google Maps suggestion.'
const ADDRESS_AUTOCOMPLETE_LOADING_HINT = 'Loading Google Maps address suggestions...'
const ADDRESS_AUTOCOMPLETE_ERROR_HINT = 'Google Maps address suggestions are currently unavailable.'
const ADDRESS_AUTOCOMPLETE_ERROR_MESSAGES = new Set([
  ADDRESS_SELECTION_ERROR,
  ADDRESS_LOADING_ERROR,
  ADDRESS_UNAVAILABLE_ERROR,
])

function clearAddressAutocompleteError(currentError: string): string {
  return ADDRESS_AUTOCOMPLETE_ERROR_MESSAGES.has(currentError) ? '' : currentError
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
  const shouldRequireGoogleAddress = Boolean(APP_CONFIG.googleMapsApiKey)
  const [formKey, setFormKey] = useState(0)
  const [localError, setLocalError] = useState('')
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null)
  const [addressAutocompleteStatus, setAddressAutocompleteStatus] =
    useState<AddressAutocompleteStatus>(
      shouldRequireGoogleAddress ? 'loading' : 'disabled',
    )
  const addressInputRef = useRef<HTMLInputElement | null>(null)
  const title = useMemo(() => 'Submit an event', [])

  useEffect(() => {
    const addressInput = addressInputRef.current

    if (!shouldRequireGoogleAddress) {
      return
    }

    if (!addressInput) {
      return
    }

    let cancelled = false
    let placeChangedListener: google.maps.MapsEventListener | null = null

    async function initializeAddressAutocomplete() {
      try {
        const googleApi = await loadGoogleMaps()
        const placesLibrary =
          (await googleApi.maps.importLibrary('places')) as google.maps.PlacesLibrary

        if (cancelled || !addressInputRef.current) {
          return
        }

        const autocomplete = new placesLibrary.Autocomplete(
          addressInputRef.current,
          {
            componentRestrictions: { country: 'us' },
            fields: ['formatted_address', 'name', 'place_id'],
          },
        )

        placeChangedListener = autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          const formattedAddress =
            place.formatted_address?.trim() || place.name?.trim() || ''

          if (!formattedAddress || !place.place_id) {
            setSelectedPlace(null)
            setLocalError(ADDRESS_SELECTION_ERROR)
            return
          }

          if (addressInputRef.current) {
            addressInputRef.current.value = formattedAddress
          }

          setSelectedPlace({
            formattedAddress,
            placeId: place.place_id,
          })
          setLocalError((current) => clearAddressAutocompleteError(current))
        })

        setAddressAutocompleteStatus('ready')
      } catch {
        if (!cancelled) {
          setAddressAutocompleteStatus('error')
        }
      }
    }

    initializeAddressAutocomplete()

    return () => {
      cancelled = true
      placeChangedListener?.remove()
    }
  }, [formKey, shouldRequireGoogleAddress])

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

    if (shouldRequireGoogleAddress) {
      if (addressAutocompleteStatus === 'loading') {
        setLocalError(ADDRESS_LOADING_ERROR)
        return
      }

      if (addressAutocompleteStatus === 'error') {
        setLocalError(ADDRESS_UNAVAILABLE_ERROR)
        return
      }

      const submittedAddress = String(formData.get('address') ?? '').trim()

      if (
        !selectedPlace ||
        !submittedAddress ||
        submittedAddress !== selectedPlace.formattedAddress
      ) {
        setLocalError(ADDRESS_SELECTION_ERROR)
        return
      }

      formData.set('address', selectedPlace.formattedAddress)
      formData.set('place_id', selectedPlace.placeId)
    }

    formData.set('form_type', 'submission')
    const succeeded = await onSubmit(formData)
    if (succeeded) {
      formElement.reset()
      if (shouldRequireGoogleAddress) {
        setAddressAutocompleteStatus('loading')
      }
      setFormKey((previous) => previous + 1)
      setSelectedPlace(null)
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

  const handleAddressChange = (event: ChangeEvent<HTMLInputElement>) => {
    onResetStatus()
    setLocalError((current) => clearAddressAutocompleteError(current))

    if (
      selectedPlace &&
      event.currentTarget.value.trim() !== selectedPlace.formattedAddress
    ) {
      setSelectedPlace(null)
    }
  }

  const addressHint =
    addressAutocompleteStatus === 'loading'
      ? ADDRESS_AUTOCOMPLETE_LOADING_HINT
      : addressAutocompleteStatus === 'error'
        ? ADDRESS_AUTOCOMPLETE_ERROR_HINT
        : shouldRequireGoogleAddress
          ? ADDRESS_AUTOCOMPLETE_HINT
          : ''

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
          <input
            ref={addressInputRef}
            aria-label="Address *"
            className={styles.input}
            name="address"
            onChange={handleAddressChange}
            required
          />
          {addressHint ? <span className={styles.formFieldHint}>{addressHint}</span> : null}
        </label>

        <label className={styles.formField}>
          <span>Website URL</span>
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
