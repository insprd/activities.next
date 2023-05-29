import * as Sentry from '@sentry/nextjs'

import { createNoteFromUserInput } from '../../../../lib/actions/createNote'
import { createPollFromUserInput } from '../../../../lib/actions/createPoll'
import { deleteStatusFromUserInput } from '../../../../lib/actions/deleteStatus'
import {
  CreateNoteParams,
  CreatePollParams,
  DeleteStatusParams
} from '../../../../lib/client'
import { DEFAULT_202, ERROR_404, ERROR_500 } from '../../../../lib/errors'
import { ApiGuard } from '../../../../lib/guard'
import { StatusNote } from '../../../../lib/models/status'
import { getSpan } from '../../../../lib/trace'

type CreateNoteRequest = { type: 'note' } & CreateNoteParams
type CreatePollRequest = { type: 'poll' } & CreatePollParams

type PostRequest = CreateNoteRequest | CreatePollRequest

const handler = ApiGuard(async (req, res, context) => {
  const span = getSpan('api', 'outbox', { method: req.method })
  const { currentActor, storage } = context
  switch (req.method) {
    case 'POST': {
      const body = req.body as PostRequest
      try {
        switch (body.type) {
          case 'note': {
            const { message, replyStatus, attachments } = body
            const status = await createNoteFromUserInput({
              currentActor,
              text: message,
              replyNoteId: replyStatus?.id,
              attachments,
              storage
            })
            if (!status) {
              span?.finish()
              res.status(500).json(ERROR_500)
              return
            }

            span?.finish()
            res.status(200).json({
              status: status?.toJson(),
              note: status.toObject(),
              attachments: (status.data as StatusNote).attachments
            })
            return
          }
          case 'poll': {
            const { message, replyStatus, choices, durationInSeconds } = body
            await createPollFromUserInput({
              currentActor,
              replyStatusId: replyStatus?.id,
              text: message,
              choices,
              storage,
              endAt: Date.now() + durationInSeconds * 1000
            })
            res.status(404).json(ERROR_404)
            return
          }
          default: {
            res.status(404).json(ERROR_404)
            return
          }
        }
      } catch (e: any) {
        Sentry.captureException(e)
        console.error(e.message)
        console.error(e.stack)
        span?.finish()
        res.status(500).json(ERROR_500)
        return
      }
    }
    case 'DELETE': {
      const { statusId } = req.body as DeleteStatusParams
      await deleteStatusFromUserInput({ currentActor, statusId, storage })
      span?.finish()
      res.status(202).json(DEFAULT_202)
      return
    }
    default: {
      span?.finish()
      res.status(404).json(ERROR_404)
    }
  }
})

export default handler
