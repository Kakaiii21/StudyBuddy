import type { Request, Response } from 'express'
import { getUid } from './middleware'
import { destroyCloudinaryAsset } from './cloudinaryClient'

/**
 * POST /deleteCloudinaryAsset   (requires a Firebase ID token)
 * Body: { publicId, resourceType? }
 * A user may only delete assets under their own folder: users/{uid}/...
 */
export async function deleteCloudinaryAsset(req: Request, res: Response): Promise<void> {
  const uid = getUid(res)

  const { publicId, resourceType = 'raw' } = (req.body ?? {}) as {
    publicId?: string
    resourceType?: 'image' | 'raw' | 'video'
  }

  if (!publicId || typeof publicId !== 'string') {
    res.status(400).json({ error: 'publicId is required.' })
    return
  }
  if (!['image', 'raw', 'video'].includes(resourceType)) {
    res.status(400).json({ error: 'Invalid resourceType.' })
    return
  }
  if (!publicId.startsWith(`users/${uid}/`) || publicId.includes('..')) {
    res.status(403).json({ error: 'You can only delete your own files.' })
    return
  }

  try {
    await destroyCloudinaryAsset(publicId, resourceType)
    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Cloudinary delete error:', err)
    res.status(500).json({ error: 'Failed to delete asset from Cloudinary.' })
  }
}
