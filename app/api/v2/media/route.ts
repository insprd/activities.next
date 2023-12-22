import { ERROR_422 } from '@/lib/errors'
import { AuthenticatedGuard } from '@/lib/services/guards/AuthenticatedGuard'
import { saveMedia } from '@/lib/services/medias'
import { MediaSchema } from '@/lib/services/medias/types'

export const POST = AuthenticatedGuard(async (req, context) => {
  try {
    const { storage, currentActor } = context
    const form = await req.formData()
    const media = MediaSchema.parse(Object.fromEntries(form.entries()))
    const response = await saveMedia(storage, currentActor, media)
    if (!response) {
      return Response.json(ERROR_422, { status: 422 })
    }
    return Response.json(response)
  } catch (e) {
    const error = e as NodeJS.ErrnoException
    console.error(error.message)
    console.error(error.stack)
    return Response.json(ERROR_422, { status: 422 })
  }
})
