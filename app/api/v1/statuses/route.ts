import { z } from 'zod'

import { createNoteFromUserInput } from '../../../../lib/actions/createNote'
import { ERROR_400, ERROR_422 } from '../../../../lib/errors'
import { AuthenticatedGuard } from '../../../../lib/guard'
import { getISOTimeUTC } from '../../../../lib/time'

export const NoteSchema = z.object({
  status: z.string(),
  in_reply_to_id: z.string().optional(),
  spoiler_text: z.string().optional(),
  media_ids: z.array(z.string()).optional()
})

export type NoteSchema = z.infer<typeof NoteSchema>

export const POST = AuthenticatedGuard(async (req, context) => {
  const { currentActor, storage } = context
  try {
    const content = await req.json()
    const note = NoteSchema.parse(content)
    const status = await createNoteFromUserInput({
      currentActor,
      text: note.status,
      replyNoteId: note.in_reply_to_id,
      attachments: [],
      storage
    })
    if (!status) {
      return Response.json(ERROR_422, { status: 422 })
    }
    return Response.json({
      id: status.id,
      created_at: getISOTimeUTC(status.createdAt),
      content: status.content
    })
  } catch {
    return Response.json(ERROR_400, { status: 400 })
  }
})
