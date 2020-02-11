import baseFetch from 'isomorphic-unfetch'
import { useFetcher } from '../use-fetcher'
import { renderFetchHook } from '../../test/utils/react-utils'
import {
  OKFetchImplementation,
  BadRequestFetchImplementation,
  OKWithHeadersRequestFetchImplementation,
  ErrorRequestFetchImplementation,
  ErrorAtParsingJSONRequestFetchImplementation,
} from '../../test/utils/fetch-mocks'
import { createClient } from '../client'

jest.mock('../src/act-hack')
jest.mock('isomorphic-unfetch', () => jest.fn())
const fetch = (baseFetch as any) as jest.Mock<ReturnType<typeof baseFetch>>

describe('Hooks', () => {
  beforeEach(() => fetch.mockReset())
  describe('useFetcher', () => {
    test('send request when fetch method is called', async () => {
      fetch.mockImplementation(OKFetchImplementation)
      const client = createClient({})
      const action = {
        url: '/foo',
        method: 'POST',
      }
      const { result, waitForNextUpdate } = renderFetchHook(
        () => useFetcher(() => action),
        { client },
      )

      expect(result.current.data).toEqual(undefined)
      expect(typeof result.current.fetch).toEqual('function')
      expect(result.current.loading).toEqual(false)
      expect(result.current.action).toEqual(undefined)
      expect(result.current.status).toEqual(undefined)
      result.current.fetch()
      expect(result.current.error).toEqual(undefined)
      expect(result.current.data).toEqual(undefined)
      expect(typeof result.current.fetch).toEqual('function')
      expect(result.current.loading).toEqual(true)
      expect(result.current.action).toEqual({
        url: '/foo',
        method: 'POST',
      })
      await waitForNextUpdate()
      expect(result.current.error).toEqual(undefined)
      expect(result.current.data).toEqual({
        foo: 'bar',
      })
      expect(result.current.status).toEqual(200)
      expect(result.current.action).toEqual({
        url: '/foo',
        method: 'POST',
      })
      expect(typeof result.current.fetch).toEqual('function')
      expect(result.current.loading).toEqual(false)
      expect(fetch.mock.calls.length).toBe(1)
    })

    test('not cache a mutation request', async () => {
      fetch.mockImplementation(OKFetchImplementation)
      const client = createClient({})
      const { result, waitForNextUpdate } = renderFetchHook(
        () =>
          useFetcher(() => ({
            url: '/foo',
            method: 'POST',
          })),
        { client },
      )
      result.current.fetch()
      await waitForNextUpdate()
      expect(client.cache.getState()).toEqual({})
    })

    test('keep action meta', async () => {
      fetch.mockImplementation(OKFetchImplementation)
      const client = createClient({})
      const action = {
        url: '/foo',
        method: 'POST',
        meta: {
          slug: 'foo',
        },
      }
      const { result, waitForNextUpdate } = renderFetchHook(
        () => useFetcher(() => action),
        { client },
      )
      result.current.fetch()
      expect(result.current.action).toEqual(action)
      await waitForNextUpdate()
      expect(result.current.action).toEqual(action)
    })

    test('have response status on error', async () => {
      fetch.mockImplementation(BadRequestFetchImplementation)
      const client = createClient({})
      const { result } = renderFetchHook(
        () =>
          useFetcher(() => ({
            url: '/foo',
            method: 'POST',
            meta: {
              slug: 'foo',
            },
          })),
        { client },
      )
      await result.current.fetch()
      expect(result.current.status).toEqual(400)
      expect(result.current.headers).toEqual({})
      expect(result.current.data).toEqual({ error: 'Bad request' })
    })

    test('have response headers on result', async () => {
      fetch.mockImplementation(OKWithHeadersRequestFetchImplementation)
      const client = createClient({})
      const { result } = renderFetchHook(
        () =>
          useFetcher(() => ({
            url: '/foo',
            method: 'POST',
            meta: {
              slug: 'foo',
            },
          })),
        { client },
      )
      await result.current.fetch()
      expect(result.current.status).toEqual(200)
      expect(result.current.headers).toEqual({ 'x-test-success': true })
      expect(result.current.data).toEqual({ foo: 'bar' })
    })

    test('throw error on fetch method', async () => {
      fetch.mockImplementation(ErrorRequestFetchImplementation)
      const client = createClient({})
      const { result } = renderFetchHook(
        () =>
          useFetcher(() => ({
            url: '/foo',
            method: 'POST',
            meta: {
              slug: 'foo',
            },
          })),
        { client },
      )
      try {
        await result.current.fetch()
      } catch (error) {
        expect(error.message).toEqual('Failed to fetch /foo')
      }

      expect(result.current.status).toEqual(undefined)
      expect(result.current.headers).toEqual(undefined)
      expect(result.current.data).toEqual(undefined)
      expect(result.current.error?.message).toBe('Failed to fetch /foo')
    })

    test('throw error at parsing json on fetch method', async () => {
      fetch.mockImplementation(ErrorAtParsingJSONRequestFetchImplementation)
      const client = createClient({})
      const { result } = renderFetchHook(
        () =>
          useFetcher(() => ({
            url: '/foo',
            method: 'POST',
            meta: {
              slug: 'foo',
            },
          })),
        { client },
      )
      try {
        await result.current.fetch()
      } catch (error) {
        expect(error.message).toEqual('Error parsing json')
      }

      expect(result.current.status).toEqual(200)
      expect(result.current.headers).toEqual({})
      expect(result.current.data).toEqual(undefined)
      expect(result.current.error?.message).toBe('Error parsing json')
    })
  })
})
