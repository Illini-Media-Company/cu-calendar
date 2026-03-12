export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024
export const MAX_IMAGE_UPLOAD_LABEL = '10 MB'
export const IMAGE_UPLOAD_LIMIT_MESSAGE = `Image upload must be ${MAX_IMAGE_UPLOAD_LABEL} or smaller.`

export function getImageUploadFile(formData: FormData): File | null {
  const value = formData.get('image_file') ?? formData.get('imageFile')

  if (!(value instanceof File) || value.size === 0 || !value.name) {
    return null
  }

  return value
}

export function validateImageUpload(formData: FormData): void {
  const file = getImageUploadFile(formData)

  if (file && file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error(IMAGE_UPLOAD_LIMIT_MESSAGE)
  }
}
