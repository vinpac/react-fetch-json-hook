import baseFetch from 'isomorphic-unfetch'
import {
  OKFetchImplementation,
  MultipleOKFetchImplementation,
} from '../../test/utils/fetch-mocks'
import { createClient } from '../client'
import { FetchResult } from '..'

jest.mock('../src/act-hack')
jest.mock('isomorphic-unfetch', () => jest.fn())
const fetch = (baseFetch as any) as jest.Mock<ReturnType<typeof baseFetch>>

describe('Fetch Client', () => {
  beforeEach(() => fetch.mockReset())

  test('reuse a promise when dispatching', async () => {
    fetch.mockImplementation(OKFetchImplementation)
    const client = createClient({})
    const action = {
      method: 'GET',
      url: '/foo',
    }
    const r = Array(8).fill(0)
    const update = jest.fn()
    r.map(() =>
      client.listen(client.idFromAction(action), {
        update,
      }),
    )
    const promise = Promise.all(r.map(() => client.dispatch(action)))
    expect(client.queue.length).toBe(1)
    await promise
    expect(update).toBeCalledTimes(8)
  })

  test('should be able to wait for queue and extract cache data', async () => {
    fetch.mockImplementation(
      MultipleOKFetchImplementation(['/foo', '/bar', '/zit']),
    )
    const client = createClient({})
    const fooAction = {
      method: 'GET',
      url: '/foo',
    }
    const barAction = {
      method: 'GET',
      url: '/bar',
    }
    const zitAction = {
      method: 'GET',
      url: '/zit',
    }
    client.dispatch(fooAction)
    client.dispatch(barAction)
    client.dispatch(zitAction)
    expect(client.queue.length).toBe(3)
    await client.waitForFetchs()
    const initialCacheState = client.cache.getState()
    expect(typeof JSON.stringify(initialCacheState)).toBe('string')
    const client2 = createClient({ initialCacheState })
    expect(client2.cache.getState()).toEqual({
      [client2.idFromAction(barAction)]: {
        id: client2.idFromAction(barAction),
        value: {
          data: {
            foo: 'bar',
          },
          headers: {},
          status: 200,
        },
        cachedAt: expect.any(Number),
      },
      [client2.idFromAction(fooAction)]: {
        id: client2.idFromAction(fooAction),
        cachedAt: expect.any(Number),
        value: {
          data: {
            foo: 'bar',
          },
          headers: {},
          status: 200,
        },
      },
      [client2.idFromAction(zitAction)]: {
        id: client2.idFromAction(zitAction),
        value: {
          data: {
            foo: 'bar',
          },
          headers: {},
          status: 200,
        },
        cachedAt: expect.any(Number),
      },
    })
  })

  test('reuse a promise when dispatching', async () => {
    fetch.mockImplementation(OKFetchImplementation)
    const client = createClient({})
    const action = {
      method: 'GET',
      url: '/foo',
    }
    const r = Array(8).fill(0)
    const update = jest.fn()
    r.map(() =>
      client.listen(client.idFromAction(action), {
        update,
      }),
    )
    const promise = Promise.all(r.map(() => client.dispatch(action)))
    expect(client.queue.length).toBe(1)
    await promise
    expect(update).toBeCalledTimes(8)
  })

  test('update cache', async () => {
    fetch.mockImplementation(MultipleOKFetchImplementation(['/foo']))
    const client = createClient({})
    await client.dispatch(
      {
        method: 'GET',
        url: '/foo',
      },
      'foo',
    )
    const expectedPrevValue = client.get('foo')
    client.set('foo', (prevValue: FetchResult<{ foo: 'bar' }>) => {
      expect(prevValue).toEqual(expectedPrevValue)
      return {
        ...prevValue,
        data: {
          ...prevValue.data,
          bar: 'foo',
        },
      }
    })
    expect(client.get('foo')).toMatchObject({
      data: {
        foo: 'bar',
        bar: 'foo',
      },
    })
  })
})
