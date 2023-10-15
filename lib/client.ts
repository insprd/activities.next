import { Duration } from './components/PostBox/PollChoices'
import { Assets, Stream } from './medias/apple/webstream'
import { Attachment, PostBoxAttachment } from './models/attachment'
import { Follow, FollowStatus } from './models/follow'
import { StatusData } from './models/status'
import { Timeline } from './timelines/types'

export interface CreateNoteParams {
  message: string
  replyStatus?: StatusData
  attachments?: PostBoxAttachment[]
}
export const createNote = async ({
  message,
  replyStatus,
  attachments = []
}: CreateNoteParams) => {
  if (message.trim().length === 0 && attachments.length === 0) {
    throw new Error('Message or attachments must not be empty')
  }

  const response = await fetch('/api/v1/accounts/outbox', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'note',
      replyStatus,
      message,
      attachments
    })
  })
  if (response.status !== 200) {
    throw new Error('Fail to create a new note')
  }

  const json = await response.json()
  return {
    status: json.status as StatusData,
    attachments: json.attachments as Attachment[]
  }
}

export interface UpdateNoteParams {
  statusId: string
  message: string
}
export const updateNote = async ({ statusId, message }: UpdateNoteParams) => {
  if (message.trim().length === 0) {
    throw new Error('Message must not be empty')
  }

  const response = await fetch(`/api/v1/statuses/${statusId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: message
    })
  })
  if (response.status !== 200) {
    throw new Error('Fail to create a new note')
  }

  return response.json()
}

export interface CreatePollParams {
  message: string
  choices: string[]
  durationInSeconds: Duration
  replyStatus?: StatusData
}

export const createPoll = async ({
  message,
  choices,
  durationInSeconds,
  replyStatus
}: CreatePollParams) => {
  if (message.trim().length === 0 && choices.length === 0) {
    throw new Error('Message or choices must not be empty')
  }

  for (const choice of choices) {
    if (choice.trim().length === 0) {
      throw new Error('Choice text must not be empty')
    }
  }

  // TODO: Continue on create poll
  await fetch('/api/v1/accounts/outbox', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'poll',
      replyStatus,
      message,
      durationInSeconds,
      choices
    })
  })
}

export interface DefaultStatusParams {
  statusId: string
}

export const deleteStatus = async ({ statusId }: DefaultStatusParams) => {
  const response = await fetch(`/api/v1/accounts/outbox`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      statusId
    })
  })
  if (response.status !== 200) {
    // Create or throw an error here
    return false
  }

  return true
}

export const repostStatus = async ({ statusId }: DefaultStatusParams) => {
  await fetch('/api/v1/accounts/repost', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ statusId })
  })
}

export const undoRepostStatus = async ({ statusId }: DefaultStatusParams) => {
  await fetch('/api/v1/accounts/repost', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ statusId })
  })
}

export const likeStatus = async ({ statusId }: DefaultStatusParams) => {
  await fetch('/api/v1/accounts/like', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ statusId })
  })
}

interface DefaultUUIDStatusParams {
  uuid: string
}

export const getStatusFavouritedBy = async ({
  uuid
}: DefaultUUIDStatusParams) => {
  const response = await fetch(`/api/v1/statuses/${uuid}/favourited_by`, {
    headers: { 'Content-Type': 'application/json' }
  })
  if (response.status !== 200) return []
  return response.json()
}

export const undoLikeStatus = async ({ statusId }: DefaultStatusParams) => {
  await fetch('/api/v1/accounts/like', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ statusId })
  })
}

interface GetAppleSharedGalleryParams {
  albumToken: string
}
export const getAppleSharedGallery = async ({
  albumToken
}: GetAppleSharedGalleryParams) => {
  const response = await fetch(`/api/v1/medias/apple/${albumToken}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (response.status !== 200) {
    // Create or throw an error here
    return
  }

  const data = await response.json()
  return data.stream as Stream
}

interface GetAppleSharedAlbumAssetsParams {
  albumToken: string
  photoGuids: string[]
}
export const getAppleSharedAlbumAssets = async ({
  albumToken,
  photoGuids
}: GetAppleSharedAlbumAssetsParams) => {
  const response = await fetch(`/api/v1/medias/apple/${albumToken}/assetsUrl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      photoGuids
    })
  })
  if (response.status !== 200) {
    // Create or throw an error here
    return
  }

  const data = await response.json()
  return data.assets as Assets
}

interface IsFollowingParams {
  targetActorId: string
}
export const isFollowing = async ({ targetActorId }: IsFollowingParams) => {
  const searchParams = new URLSearchParams({ targetActorId })
  const response = await fetch(`/api/v1/accounts/follow?${searchParams}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  })
  if (response.status !== 200) {
    return false
  }

  const data = await response.json()
  if (!data.follow) return false
  const follow = data.follow as Follow
  return follow.status === FollowStatus.Accepted
}

interface GetTimelineParams {
  timeline: Timeline
  startAfterStatusId?: string
}
export const getTimeline = async ({
  timeline,
  startAfterStatusId
}: GetTimelineParams) => {
  const path = `/api/v1/timelines/${timeline}`
  const url = new URL(`${window.origin}${path}`)
  if (startAfterStatusId) {
    url.searchParams.append('startAfterStatusId', startAfterStatusId)
  }
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  })
  if (response.status !== 200) return []
  const data = await response.json()
  return data.statuses as StatusData[]
}

interface DeleteSessionParams {
  token: string
}
export const deleteSession = async ({ token }: DeleteSessionParams) => {
  const path = `/api/v1/accounts/sessions/${token}`
  const response = await fetch(path, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (response.status !== 200) return false
  return true
}
