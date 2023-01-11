import { FetchMock } from 'jest-fetch-mock'

import { MockLitepubNote, MockMastodonNote } from './note'
import { MockActivityPubPerson } from './person'
import { MockWebfinger } from './webfinger'

export const mockRequests = (fetchMock: FetchMock) => {
  fetchMock.mockResponse(async (req) => {
    const url = new URL(req.url)
    if (req.method === 'GET') {
      if (url.pathname === '/.well-known/webfinger') {
        const account =
          url.searchParams.get('resource')?.slice('acct:'.length) || ''
        const username = account.split('@').shift()
        if (username === 'notexist') {
          return {
            status: 404
          }
        }

        const userUrl =
          url.hostname === 'somewhere.test'
            ? `https://${url.hostname}/actors/${username}`
            : `https://${url.hostname}/users/${username}`
        return {
          status: 200,
          body: JSON.stringify(
            MockWebfinger({
              account,
              userUrl
            })
          )
        }
      }

      if (url.pathname.includes('/inbox')) {
        return {
          status: 202,
          body: ''
        }
      }

      // llun.test domain
      if (url.pathname.includes('/statuses')) {
        const from = req.url.slice(0, req.url.indexOf('/statuses'))
        return {
          status: 200,
          body: JSON.stringify(
            MockMastodonNote({
              id: req.url,
              from,
              content: 'This is status',
              withContext: true
            })
          )
        }
      }

      // somewhere.test domain e.g. https://somewhere.test/actors/{username}/lp/{status-id}
      if (url.pathname.includes('/lp/')) {
        const from = req.url.slice(0, req.url.indexOf('/lp/'))
        return {
          status: 200,
          body: JSON.stringify(
            MockLitepubNote({
              id: req.url,
              from,
              content: 'This is litepub status',
              withContext: true
            })
          )
        }
      }

      // somewhere.test domain e.g. https://somewhere.test/s/{username}/{status-id}
      if (url.pathname.startsWith('/s')) {
        const [, username] = url.pathname.slice(1).split('/')
        return {
          status: 200,
          body: JSON.stringify(
            MockMastodonNote({
              id: req.url,
              from: `https://${url.hostname}/actors/${username}`,
              content: 'This is status',
              withContext: true
            })
          )
        }
      }

      if (
        url.pathname.startsWith('/actors') ||
        url.pathname.startsWith('/users')
      ) {
        return {
          status: 200,
          body: JSON.stringify(MockActivityPubPerson({ id: req.url }))
        }
      }

      return {
        status: 404,
        body: 'Not Found'
      }
    }

    if (req.method === 'POST') {
      if (url.pathname === '/inbox') {
        return {
          status: 200
        }
      }
    }

    return {
      status: 404
    }
  })
}
