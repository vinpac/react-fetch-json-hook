import baseFetch from 'isomorphic-unfetch'
import {
  OKFetchImplementation,
  MultipleOKFetchImplementation,
} from '../../test/utils/fetch-mocks'
import { createClient } from '../client'
import { mutate } from '../mutate-browser-cache'

jest.mock('../src/act-hack')
jest.mock('isomorphic-unfetch', () => jest.fn())
const fetch = (baseFetch as any) as jest.Mock<ReturnType<typeof baseFetch>>

describe('Cache', () => {
  beforeEach(() => fetch.mockReset())

  test('mutate cache on browser', async () => {
    fetch.mockImplementation(OKFetchImplementation)
    const client = createClient({})
    await client.dispatch(
      {
        method: 'GET',
        url: '/foo',
      },
      'foo',
    )
    expect(client.get('foo')).toMatchObject({ data: { foo: 'bar' } })
    mutate('foo', {
      data: { bar: 'foo' },
    })
    expect(client.get('foo')).toMatchObject({ data: { bar: 'foo' } })
  })
})
