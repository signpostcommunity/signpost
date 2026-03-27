/**
 * Client-side image resizer for profile photo uploads.
 * Resizes images exceeding maxSizeMB by scaling down dimensions
 * and reducing JPEG quality until the file fits under the limit.
 */
export async function resizeImage(file: File, maxSizeMB = 2): Promise<File> {
  if (file.size <= maxSizeMB * 1024 * 1024) return file

  const img = new Image()
  const url = URL.createObjectURL(file)

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
    img.src = url
  })

  let { width, height } = img
  const maxDimension = 1200

  if (width > maxDimension || height > maxDimension) {
    const ratio = Math.min(maxDimension / width, maxDimension / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, width, height)

  URL.revokeObjectURL(url)

  let quality = 0.9
  let blob: Blob
  do {
    blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', quality)
    })
    quality -= 0.1
  } while (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.3)

  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
    type: 'image/jpeg',
  })
}
