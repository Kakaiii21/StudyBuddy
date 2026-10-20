import { v2 as cloudinary } from 'cloudinary'
import { config } from './config'

export type CloudinaryResourceType = 'image' | 'raw' | 'video'

/**
 * Deletes an asset. Credentials are passed per call instead of through the
 * global cloudinary.config(), because in a single long-running server two
 * different key sets (main + webhook) would otherwise overwrite each other.
 */
export async function destroyCloudinaryAsset(
  publicId: string,
  resourceType: CloudinaryResourceType = 'raw',
  useWebhookKeys = false
): Promise<void> {
  const c = config.cloudinary
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    cloud_name: c.cloudName,
    api_key: useWebhookKeys ? c.webhookApiKey : c.apiKey,
    api_secret: useWebhookKeys ? c.webhookApiSecret : c.apiSecret,
  } as Record<string, unknown>)
}
