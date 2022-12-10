import { createNoteFromUserInput } from '../../../../lib/actions/createNote'
import { sendNote } from '../../../../lib/activities'
import { CreateStatusParams } from '../../../../lib/client'
import { ERROR_404 } from '../../../../lib/errors'
import { ApiGuard } from '../../../../lib/guard'

const handler = ApiGuard(async (req, res, context) => {
  const { currentActor, storage } = context
  switch (req.method) {
    case 'POST': {
      const body = req.body
      const { message, replyStatus, attachments } = body as CreateStatusParams
      const {
        status,
        note,
        attachments: storedAttachments
      } = await createNoteFromUserInput({
        currentActor,
        text: message,
        replyNoteId: replyStatus?.id,
        attachments,
        storage
      })
      const inboxes = await storage.getFollowersInbox({
        targetActorId: currentActor.id
      })
      await Promise.all(
        inboxes.map((inbox) => {
          return sendNote({
            currentActor,
            inbox,
            note
          })
        })
      )
      return res
        .status(200)
        .json({ status, note, attachments: storedAttachments })
    }
    default: {
      res.status(404).json(ERROR_404)
    }
  }
})

export default handler
