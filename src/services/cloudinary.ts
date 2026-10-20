const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const PROFILE_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PROFILE_PRESET
const COURSE_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_COURSE_PRESET

export interface CloudinaryUploadResult {
  url: string
  publicId: string
  fileName: string
  fileType: string
  fileSize: string
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const sanitizeFileName = (name: string): string => {
  const withoutExt = name.replace(/\.[^/.]+$/, '')
  return withoutExt.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60)
}

export async function uploadToCloudinary(
  file: File,
  onProgress?: (percent: number) => void,
  userId?: string,
  courseId?: string
): Promise<CloudinaryUploadResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const isImage = ['png', 'jpg', 'jpeg'].includes(ext)
  const resourceType = isImage ? 'image' : 'raw'

  let uploadPreset: string
  let publicId: string | undefined

  if (userId && courseId) {
    // Course file flow — public_id must match: users/{uid}/courses/{courseId}/...
    uploadPreset = COURSE_UPLOAD_PRESET
    publicId = `users/${userId}/courses/${courseId}/${Date.now()}_${sanitizeFileName(file.name)}`
  } else if (userId) {
    // Profile picture flow — public_id must match: users/{uid}/profile_...
    uploadPreset = PROFILE_UPLOAD_PRESET
    publicId = `users/${userId}/profile_${Date.now()}`
  } else {
    console.warn('uploadToCloudinary called without userId — moderation webhook will ignore this upload.')
    uploadPreset = COURSE_UPLOAD_PRESET
  }

  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)
    if (publicId) {
      formData.append('public_id', publicId)
    } else {
      formData.append('folder', 'courses')
    }

    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100)
        onProgress(percent)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText)
        resolve({
          url: data.secure_url,
          publicId: data.public_id,
          fileName: file.name,
          fileType: ext,
          fileSize: formatSize(file.size),
        })
      } else {
        const errorData = JSON.parse(xhr.responseText)
        console.error('Cloudinary error:', errorData)
        reject(new Error(`Upload failed: ${errorData.error?.message || xhr.responseText}`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Upload failed')))

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`)
    xhr.send(formData)
  })
}