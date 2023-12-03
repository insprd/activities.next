import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import crypto from 'crypto'
import format from 'date-fns-tz/format'
import shape from 'sharp'

import {
  MediaStorageObjectConfig,
  MediaStorageType
} from '../../config/mediaStorage'
import { MAX_HEIGHT, MAX_WIDTH, MediaStorageSaveFile } from './constants'

const uploadFileToS3 = async (
  currentTime: number,
  mediaStorageConfig: MediaStorageObjectConfig,
  file: File
) => {
  const { bucket, region } = mediaStorageConfig
  const randomPrefix = crypto.randomBytes(8).toString('hex')

  const resizedImage = shape(Buffer.from(await file.arrayBuffer()))
    .resize(MAX_WIDTH, MAX_HEIGHT, { fit: 'inside' })
    .jpeg({ quality: 80 })

  const timeDirectory = format(currentTime, 'yyyy-MM-dd')
  const path = `medias/${timeDirectory}/${randomPrefix}-${file.name}`
  const s3client = new S3Client({ region })
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: path,
    Body: await resizedImage.toBuffer()
  })
  await s3client.send(command)
  return { image: resizedImage, path }
}

export const saveObjectStorageFile: MediaStorageSaveFile = async (
  config,
  host,
  storage,
  actor,
  media
) => {
  if (config.type !== MediaStorageType.ObjectStorage) return null

  const { file } = media
  const currentTime = Date.now()
  const { image, path } = await uploadFileToS3(currentTime, config, file)
  const metaData = await image.metadata()
  const storedMedia = await storage.createMedia({
    actorId: actor.id,
    original: {
      path,
      bytes: media.file.size,
      mimeType: media.file.type,
      metaData: {
        width: metaData.width ?? 0,
        height: metaData.height ?? 0
      }
    },
    ...(media.description ? { description: media.description } : null)
  })
  if (!storedMedia) {
    throw new Error('Fail to store media')
  }
  return {
    id: storedMedia.id,
    type: media.file.type.startsWith('image') ? 'image' : 'video',
    // TODO: Add config for base image domain?
    url: `https://${host}/api/v1/files/${storedMedia.original.path
      .split('/')
      .pop()}`,
    preview_url: '',
    text_url: '',
    remote_Url: '',
    meta: {
      original: {
        width: storedMedia.original.metaData.width,
        height: storedMedia.original.metaData.height,
        size: `${storedMedia.original.metaData.width}x${storedMedia.original.metaData.height}`,
        aspect:
          storedMedia.original.metaData.width /
          storedMedia.original.metaData.height
      },
      ...(storedMedia.thumbnail
        ? {
            small: {
              width: storedMedia.thumbnail.metaData.width,
              height: storedMedia.thumbnail.metaData.height,
              size: `${storedMedia.thumbnail.metaData.width}x${storedMedia.thumbnail.metaData.height}`,
              aspect:
                storedMedia.thumbnail.metaData.width /
                storedMedia.thumbnail.metaData.height
            }
          }
        : null)
    },
    description: media?.description ?? ''
  }
}