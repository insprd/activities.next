import { ApiGuard } from '../../../../lib/guard'
import { DEFAULT_202, ERROR_404 } from '../../../../lib/responses'

const handler = ApiGuard(async (req, res, context) => {
  const { storage, currentActor } = context
  switch (req.method) {
    case 'POST': {
      const { statusId } = req.body
      await storage.createLike({ actorId: currentActor.id, statusId })
      return res.status(202).json(DEFAULT_202)
    }
    case 'DELETE': {
      const { statusId } = req.body
      await storage.deleteLike({ actorId: currentActor.id, statusId })
      return res.status(202).json(DEFAULT_202)
    }
    default: {
      return res.status(404).json(ERROR_404)
    }
  }
})
export default handler
