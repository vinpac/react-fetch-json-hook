import baseFetch from 'isomorphic-unfetch'
import { renderFetchHook } from '../../test/utils/react-utils'
import {
  OKFetchImplementation,
  ErrorRequestFetchImplementation,
  ErrorAtParsingJSONRequestFetchImplementation,
} from '../../test/utils/fetch-mocks'
import { createClient } from '../client'
import { useFetch } from '../use-fetch'

jest.mock('../src/act-hack')
jest.mock('isomorphic-unfetch', () => jest.fn())
const fetch = (baseFetch as any) as jest.Mock<ReturnType<typeof baseFetch>>

describe('Hooks', () => {
  beforeEach(() => fetch.mockReset())
  describe('useFetch', () => {
    test('request an url on render', async () => {
      fetch.mockImplementation(OKFetchImplementation)
      const client = createClient({})
      const action = {
        url: '/foo',
        method: 'GET',
      }
      const { result, waitForNextUpdate } = renderFetchHook(
        () => useFetch(action),
        { client },
      )

      expect(result.current.error).toEqual(undefined)
      expect(result.current.data).toEqual(undefined)
      expect(result.current.loading).toEqual(true)
      await waitForNextUpdate()
      expect(result.current.error).toEqual(undefined)
      expect(result.current.data).toEqual({
        foo: 'bar',
      })
      expect(result.current.status).toEqual(200)
      expect(result.current.action).toEqual(action)
      expect(result.current.loading).toEqual(false)
      expect(fetch.mock.calls.length).toBe(1)
    })
    test('use cache instead of requesting an url on render', async () => {
      fetch.mockImplementation(OKFetchImplementation)
      const action = {
        url: '/foo',
        method: 'GET',
      }
      const client = createClient({})
      client.cache.setState({
        [client.idFromAction(action)]: {
          value: {
            id: client.idFromAction(action),
            headers: {},
            status: 200,
            data: {
              foo: 'bar',
            },
          },
          cachedAt: Date.now(),
        },
      })
      const { result } = renderFetchHook(() => useFetch(action), { client })

      expect(result.current.error).toEqual(undefined)
      expect(result.current.data).toEqual({ foo: 'bar' })
      expect(result.current.loading).toEqual(false)
      expect(result.current.status).toEqual(200)
      expect(result.current.action).toEqual(action)
      expect(fetch.mock.calls.length).toBe(0)
    })

    test('sync states between useFetch instances', async () => {
      fetch.mockImplementation(OKFetchImplementation)
      const action = {
        url: '/foo',
        method: 'GET',
      }
      const client = createClient({})
      const ranged = Array(8).fill(0)
      const hooks = ranged.map(() =>
        renderFetchHook(() => useFetch(action), { client }),
      )

      expect(hooks.map(h => h.result.current.error)).toEqual(
        hooks.map(() => undefined),
      )
      expect(hooks.map(h => h.result.current.data)).toEqual(
        hooks.map(() => undefined),
      )
      expect(hooks.map(h => h.result.current.loading)).toEqual(
        hooks.map(() => true),
      )
      await hooks[0].waitForNextUpdate()
      expect(hooks.map(h => h.result.current.error)).toEqual(
        hooks.map(() => undefined),
      )
      expect(hooks.map(h => h.result.current.data)).toEqual(
        hooks.map(() => ({ foo: 'bar' })),
      )
      expect(hooks.map(h => h.result.current.loading)).toEqual(
        hooks.map(() => false),
      )
      expect(hooks.map(h => h.result.current.status)).toEqual(
        hooks.map(() => 200),
      )
      expect(hooks.map(h => h.result.current.action)).toEqual(
        hooks.map(() => action),
      )
      expect(fetch.mock.calls.length).toBe(1)
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
        () => useFetch(action),
        { client },
      )
      await waitForNextUpdate()
      expect(result.current.action?.meta).toEqual(action.meta)
    })

    test('do not throw error on render', async () => {
      fetch.mockImplementation(ErrorRequestFetchImplementation)
      const client = createClient({})
      const { result, waitForNextUpdate } = renderFetchHook(
        () =>
          useFetch({
            url: '/foo',
            method: 'GET',
            meta: {
              slug: 'foo',
            },
          }),
        { client },
      )
      await waitForNextUpdate()
      expect(result.current.status).toEqual(undefined)
      expect(result.current.headers).toEqual(undefined)
      expect(result.current.data).toEqual(undefined)
      expect(result.current.error?.message).toBe('Failed to fetch /foo')
    })

    test('do not throw error at parsing json on mutate method', async () => {
      fetch.mockImplementation(ErrorAtParsingJSONRequestFetchImplementation)
      const client = createClient({})
      const { result, waitForNextUpdate } = renderFetchHook(
        () =>
          useFetch({
            url: '/foo',
            method: 'POST',
            meta: {
              slug: 'foo',
            },
          }),
        { client },
      )
      await waitForNextUpdate()

      expect(result.current.status).toEqual(200)
      expect(result.current.headers).toEqual({})
      expect(result.current.data).toEqual(undefined)
      expect(result.current.error?.message).toBe('Error parsing json')
    })

    test('should fire an update if action changed', async () => {
      fetch.mockImplementation(OKFetchImplementation)
      const client = createClient({})
      const { result, waitForNextUpdate, rerender } = renderFetchHook(
        ({ url }) =>
          useFetch({
            url: url,
            method: 'GET',
          }),
        {
          client,
          initialProps: {
            url: '/bar',
          },
        },
      )

      expect(result.current.error).toEqual(undefined)
      expect(result.current.data).toEqual(undefined)
      expect(result.current.loading).toEqual(true)
      await waitForNextUpdate()
      expect(result.current.error?.message).toEqual(
        "Invalid input given. Expected '/foo' found '/bar'",
      )
      expect(result.current.data).toEqual(undefined)
      expect(result.current.loading).toEqual(false)
      rerender({ url: '/foo' })
      expect(result.current.error).toEqual(undefined)
      expect(result.current.data).toEqual(undefined)
      expect(result.current.loading).toEqual(true)
      await waitForNextUpdate()
      expect(result.current.error).toEqual(undefined)
      expect(result.current.data).toEqual({
        foo: 'bar',
      })
      expect(result.current.status).toEqual(200)
      expect(result.current.action).toEqual({
        url: '/foo',
        method: 'GET',
      })
      expect(result.current.loading).toEqual(false)
      expect(fetch.mock.calls.length).toBe(2)
    })

    test('should not fire an update if action changed before resolving', async () => {
      fetch.mockImplementation(OKFetchImplementation)
      const client = createClient({})
      const { result, waitForNextUpdate, rerender } = renderFetchHook(
        ({ url }) =>
          useFetch({
            url: url,
            method: 'GET',
          }),
        {
          client,
          initialProps: {
            url: '/bar',
          },
        },
      )

      expect(result.current.error).toEqual(undefined)
      expect(result.current.data).toEqual(undefined)
      expect(result.current.loading).toEqual(true)
      rerender({ url: '/foo' })
      expect(result.current.error).toEqual(undefined)
      expect(result.current.data).toEqual(undefined)
      expect(result.current.loading).toEqual(true)
      await waitForNextUpdate()
      expect(result.current.error).toEqual(undefined)
      expect(result.current.data).toEqual({
        foo: 'bar',
      })
      expect(result.current.status).toEqual(200)
      expect(result.current.action).toEqual({
        url: '/foo',
        method: 'GET',
      })
      expect(result.current.loading).toEqual(false)
      expect(fetch.mock.calls.length).toBe(2)
    })

    test('only the data should change when mutating cache', async () => {
      fetch.mockImplementation(OKFetchImplementation)
      const client = createClient({})
      const { result, waitForNextUpdate } = renderFetchHook(
        () =>
          useFetch({
            id: 'foo',
            url: '/foo',
            method: 'GET',
          }),
        { client },
      )

      await waitForNextUpdate()
      expect(result.current.error).toEqual(undefined)
      expect(result.current.data).toEqual({
        foo: 'bar',
      })
      client.set('foo', { data: { foo: 'zit' } })
      expect(result.current.data).toEqual({
        foo: 'zit',
      })
    })
  })
})
