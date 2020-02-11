import baseFetch from 'isomorphic-unfetch'
import { OKFetchImplementation } from '../../test/utils/fetch-mocks'
import { createClient } from '../client'
import {
  mutateFetchCache,
  registerClientForLocalMutations,
  removeRegisteredClientForLocalMutations,
} from '../mutate-local-fetch-cache'

jest.mock('../src/act-hack')
jest.mock('isomorphic-unfetch', () => jest.fn())
const fetch = (baseFetch as any) as jest.Mock<ReturnType<typeof baseFetch>>

describe('Cache', () => {
  beforeEach(() => fetch.mockReset())
  beforeEach(() => removeRegisteredClientForLocalMutations())

  test('mutate cache on browser', async () => {
    fetch.mockImplementation(OKFetchImplementation)
    const client = createClient({})
    registerClientForLocalMutations(client)
    await client.dispatch(
      {
        method: 'GET',
        url: '/foo',
      },
      'foo',
    )
    expect(client.get('foo')).toMatchObject({ data: { foo: 'bar' } })
    mutateFetchCache('foo', {
      data: { bar: 'foo' },
    })
    expect(client.get('foo')).toMatchObject({ data: { bar: 'foo' } })
  })

  test('throw error if client was not registered for local mutations', async () => {
    fetch.mockImplementation(OKFetchImplementation)
    createClient({})
    try {
      mutateFetchCache('foo', {
        data: { bar: 'foo' },
      })
      throw new Error('Mutation happened')
    } catch (error) {
      expect(error.message).toContain('not registered for local mutations')
    }
  })
})
