import memoize from 'lodash/memoize'
import { Resend } from 'resend'

import { getConfig } from '../../config'
import { getAddressFromEmail } from './smtp'
import { BaseEmailSettings, Message } from './types'

export const TYPE_RESEND = 'resend'

export interface ResendConfig extends BaseEmailSettings {
  type: typeof TYPE_RESEND
  token: string
}

const getResend = memoize((config: ResendConfig) => {
  return new Resend(config.token)
})

export async function sendResendMail(message: Message) {
  const config = getConfig()
  if (!config.email) return
  if (config.email.type !== TYPE_RESEND) return

  const resend = getResend(config.email)
  await resend.emails.send({
    from: getAddressFromEmail(message.from),
    to: message.to.map((email) => getAddressFromEmail(email)),
    subject: message.subject,
    ...(message.replyTo
      ? { reply_to: getAddressFromEmail(message.replyTo) }
      : null),
    html: message.content.html,
    text: message.content.text
  })
}
