import crypto from 'crypto'
import format from 'date-fns/format'
import 'linkify-plugin-mention'
import linkifyStr from 'linkify-string'

import { Note } from '../activities/entities/note'
import { Question } from '../activities/entities/question'
import { getConfig } from '../config'
import { Actor, getAtUsernameFromId } from './actor'

export type Visibility = 'public' | 'unlisted' | 'private' | 'direct'

// https://github.com/mastodon/mastodon/blob/a5394980f22e061ec7e4f6df3f3b571624f5ca7d/app/lib/activitypub/parser/status_parser.rb#L3
export interface Status {
  id: string
  url: string

  actorId: string

  type: 'Note' | 'Question'
  text: string
  summary: string | null

  createdAt: number
  updatedAt?: number

  to: string[]
  cc: string[]

  reply: string
  sensitive: boolean
  visibility: Visibility
  language?: string

  thread?: string
  conversation: string
  mediaAttachmentIds: string[]
}

export const fromJson = (data: Note | Question): Status => ({
  id: data.id,
  url: data.url || data.id,

  actorId: data.attributedTo,

  type: data.type,
  text: data.content,
  summary: data.summary,

  to: data.to,
  cc: data.cc,

  createdAt: new Date(data.published).getTime(),

  reply: data.replies.id,
  sensitive: data.sensitive,
  visibility: 'public',
  language: Object.keys(data.contentMap).shift(),

  conversation: data.conversation,
  mediaAttachmentIds: []
})

interface CreateStatusParms {
  text: string
  currentActor: Actor
  replyStatus?: Status
}
export const createStatus = async ({
  currentActor,
  text,
  replyStatus
}: CreateStatusParms): Promise<Status> => {
  const currentTime = Date.now()
  const postId = crypto.randomUUID()
  const host = getConfig().host
  const id = `${currentActor.id}/statuses/${postId}`
  const trimText = text.trim()
  console.log(trimText)

  const content = linkifyStr(trimText, {
    rel: 'nofollow noopener noreferrer',
    target: '_blank',
    truncate: 42,
    defaultProtocol: 'https'
  })
  console.log(content)
  return {
    id: `${currentActor.id}/statuses/${postId}`,
    url: `https://${host}/${getAtUsernameFromId(currentActor.id)}/${postId}`,
    actorId: currentActor.id,
    type: 'Note',
    text: `<p>${content}</p>`,
    summary: null,
    conversation: `tag:${host},${format(
      currentTime,
      'yyyy-MM-dd'
    )}:objectId=${crypto.randomUUID()}:objectType=Conversation`,
    to: ['https://www.w3.org/ns/activitystreams#Public'],
    cc: [`${currentActor.id}/followers`],
    mediaAttachmentIds: [],
    visibility: 'public',
    sensitive: false,
    language: 'en',
    reply: `${id}/replies`,
    createdAt: currentTime
  }
}
