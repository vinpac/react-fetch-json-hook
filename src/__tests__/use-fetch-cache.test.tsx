import baseFetch from 'isomorphic-unfetch'
import { renderFetchHook } from '../../test/utils/react-utils'
import { OKFetchImplementation } from '../../test/utils/fetch-mocks'
import { createClient } from '../client'
import { useFetchCache } from '../use-fetch-cache'

jest.mock('../src/act-hack')
jest.mock('isomorphic-unfetch', () => jest.fn())
const fetch = (baseFetch as any) as jest.Mock<ReturnType<typeof baseFetch>>

describe('Cache', () => {
  test('listen to cache mutations', async () => {
    const client = createClient({})
    const update = jest.fn()
    client.listen('foo', { update })
    client.set('foo', { status: 200, headers: {}, data: 'foo' })
    expect(update).toBeCalledTimes(1)
  })

  test('unlisten to cache mutations', async () => {
    const client = createClient({})
    const update = jest.fn()
    const unlisten = client.listen('foo', { update })
    client.set('foo', 'foo')
    unlisten()
    client.set('foo', 'bar')
    expect(update).toBeCalledTimes(1)
  })

  describe('useFetchCache', () => {
    test('keep cache synced across hooks instances', async () => {
      fetch.mockImplementation(OKFetchImplementation)
      const client = createClient({})
      const ranged = Array(8).fill(0)
      const expectedValue = { data: 'hey' }
      const hooks = ranged.map(() =>
        renderFetchHook(() => useFetchCache('foo'), { client }),
      )
      const [, setCacheValue] = hooks[0].result.current

      setCacheValue(expectedValue)
      expect(hooks.map(h => h.result.current[0])).toEqual(
        ranged.map(() => expectedValue),
      )
    })
  })
})
