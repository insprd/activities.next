import formidable from 'formidable'
import z from 'zod'

import { getConfig } from '../../../lib/config'
import { errorResponse } from '../../../lib/errors'
import { ApiGuard } from '../../../lib/guard'
import { ApiTrace } from '../../../lib/trace'

const FormidableFile = z.object({
  filepath: z.string(),
  originalFilename: z.string(),
  size: z.number()
})

export const MediaSchema = z.object({
  file: FormidableFile,
  thumbnail: FormidableFile.optional(),
  description: z.string().optional()
})

export const config = {
  api: {
    bodyParser: false
  }
}

const handler = ApiTrace(
  'v2/media',
  ApiGuard(async (req, res, context) => {
    const { storage, currentActor } = context
    const config = getConfig()
    switch (req.method) {
      case 'POST': {
        if (!config.mediaStorage) {
          return errorResponse(res, 500)
        }
        try {
          const form = formidable({
            allowEmptyFiles: true,
            minFileSize: 0
          })
          const [fields, files] = await form.parse(req)
          const combined = {
            ...Object.keys(fields).reduce((out, field) => {
              const values = fields[field]
              const value = (Array.isArray(values) ? values : [values])
                .filter((item) => item.length > 0)
                .shift()
              return {
                ...out,
                ...(value && { [field]: value })
              }
            }, {}),
            ...Object.keys(files).reduce((out, file) => {
              const values = files[file]
              const value = (Array.isArray(values) ? values : [values])
                .filter((item) => item.size > 0)
                .shift()
              return {
                ...out,
                ...(value && { [file]: value })
              }
            }, {})
          }
          const parsedInput = MediaSchema.parse(combined)
          const media = await storage.createMedia({
            actorId: currentActor.id,
            original: {
              storage: config.mediaStorage.type,
              path: parsedInput.file.filepath
            },
            ...(parsedInput.thumbnail
              ? {
                  thumbnail: {
                    storage: config.mediaStorage.type,
                    path: parsedInput.thumbnail.filepath
                  }
                }
              : null),
            ...(parsedInput.description
              ? { description: parsedInput.description }
              : null)
          })
          // TODO: Fix FS path
          // TODO: Fix FS filename
          // TODO: Upload file to Object Storage
          console.log(media)
          res.status(200).json({
            id: 1,
            type: 'image',
            url: '',
            preview_url: '',
            text_url: '',
            remote_Url: '',
            meta: {
              focus: {
                x: 0,
                y: 0
              },
              original: {
                width: 100,
                height: 100,
                size: '100x100',
                aspect: 1.3
              },
              small: {
                width: 50,
                height: 50,
                size: '50x50',
                aspect: 1.3
              }
            },
            description: media?.description ?? '',
            blurhash: ''
          })
        } catch {
          return errorResponse(res, 422)
        }

        return
      }
      default: {
        return errorResponse(res, 404)
      }
    }
  })
)

export default handler