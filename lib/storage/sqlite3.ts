import { knex, Knex } from 'knex'
import crypto from 'crypto'

import { Storage } from './types'

import { Status } from '../models/status'
import { Actor } from '../models/actor'
import { getConfig } from '../config'
import { Follow } from '../models/follow'

export class Sqlite3Storage implements Storage {
  database: Knex

  constructor(config: Knex.Config) {
    this.database = knex(config)
  }

  async isAccountExists(email?: string | null) {
    if (!email) return false
    const result = await this.database('accounts')
      .where('email', email)
      .count('id as count')
      .first()
    return Boolean(result?.count && result?.count > 0)
  }

  async isUsernameExists(username: string) {
    const response = await this.database('actors')
      .where('preferredUsername', username)
      .count('id as count')
      .first()
    return Boolean(response?.count && response?.count > 0)
  }

  async createAccount(params: {
    email: string
    username: string
    privateKey: string
    publicKey: string
  }) {
    const { email, username, privateKey, publicKey } = params
    const config = getConfig()
    const accountId = crypto.randomUUID()
    const actorId = `https://${config.host}/users/${username}`
    const currentTime = Date.now()
    await this.database.transaction(async (trx) => {
      await trx('accounts').insert({
        id: accountId,
        email,
        createdAt: currentTime,
        updatedAt: currentTime
      })
      await trx('actors').insert({
        id: actorId,
        accountId,
        preferredUsername: username,
        publicKey,
        privateKey,
        createdAt: currentTime,
        updatedAt: currentTime
      })
    })

    return accountId
  }

  async getActorFromEmail(email: string) {
    return this.database('actors')
      .select<Actor>('actors.*')
      .leftJoin('accounts', 'actors.accountId', 'accounts.id')
      .where('accounts.email', email)
      .first()
  }

  async isCurrentActorFollowing(
    currentActorId: string,
    followingActorId: string
  ) {
    const result = await this.database('follows')
      .where('actorId', currentActorId)
      .andWhere('targetActorId', followingActorId)
      .andWhere('status', 'Accepted')
      .count('id as count')
      .first()
    return Boolean(result?.count && result?.count > 0)
  }

  async getActorFromUsername(username: string) {
    return this.database<Actor>('actors')
      .where('preferredUsername', username)
      .first()
  }

  async getActorFromId(id: string) {
    return this.database<Actor>('actors').where('id', id).first()
  }

  async getActorFollowingCount(actorId: string) {
    const result = await this.database('follows')
      .where('actorId', actorId)
      .andWhere('status', 'Accepted')
      .count('* as count')
      .first()
    return (result?.count as number) || 0
  }

  async getActorFollowersCount(actorId: string) {
    const result = await this.database('follows')
      .where('targetActorId', actorId)
      .andWhere('status', 'Accepted')
      .count('* as count')
      .first()
    return (result?.count as number) || 0
  }

  async createFollow(actorId: string, targetActorId: string) {
    const currentTime = Date.now()
    const follow: Follow = {
      id: crypto.randomUUID(),
      actorId: actorId,
      actorHost: new URL(actorId).host,
      targetActorId,
      targetActorHost: new URL(targetActorId).host,
      status: 'Requested',
      createdAt: currentTime,
      updatedAt: currentTime
    }
    await this.database('follows').insert(follow)
    return follow
  }

  async getFollowFromId(followId: string) {
    return this.database<Follow>('follows').where('id', followId).first()
  }

  async getAcceptedOrRequestedFollow(actorId: string, targetActorId: string) {
    return this.database<Follow>('follows')
      .where('actorId', actorId)
      .where('targetActorId', targetActorId)
      .whereIn('status', ['Accepted', 'Requested'])
      .orderBy('createdAt', 'desc')
      .first()
  }

  async updateFollowStatus(
    followId: string,
    status: 'Requested' | 'Accepted' | 'Rejected' | 'Undo'
  ) {
    await this.database('follows').where('id', followId).update({
      status,
      updatedAt: Date.now()
    })
  }

  async createStatus(status: Status) {
    const { mediaAttachmentIds, ...rest } = status
    await this.database.insert(rest).into('statuses')
  }

  async getStatuses(params?: { actorId?: string }) {
    return this.database<Status>('statuses')
      .select('*')
      .orderBy('createdAt', 'desc')
  }

  async getActorStatusesCount(actorId: string) {
    const result = await this.database('statuses')
      .where('actorId', actorId)
      .count<{ count: number }>('* as count')
      .first()
    return result?.count || 0
  }
}
