import type { NextApiHandler } from 'next'

import { createNote } from '../../lib/actions/createNote'
import { StatusActivity } from '../../lib/activities/actions/status'
import { ERROR_404, ERROR_500 } from '../../lib/errors'
import { activitiesGuard } from '../../lib/guard'
import { compact } from '../../lib/jsonld'
import { getStorage } from '../../lib/storage'

const ApiHandler: NextApiHandler = activitiesGuard(
  async (req, res) => {
    const body = (await compact(JSON.parse(req.body))) as StatusActivity
    const storage = await getStorage()
    if (!storage) {
      return res.status(500).send(ERROR_500)
    }

    switch (body.type) {
      case 'Create': {
        switch (body.object.type) {
          case 'Note': {
            await createNote({ storage, note: body.object })
            break
          }
        }
        return res.status(202).send('')
      }
      default:
        return res.status(404).send(ERROR_404)
    }
  },
  ['POST']
)

export default ApiHandler
