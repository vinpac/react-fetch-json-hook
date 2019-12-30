import React from 'react'
import baseFetch from 'isomorphic-unfetch'
import { MultipleOKFetchImplementation } from '../../test/utils/fetch-mocks'
import { createClient } from '../client'
import { useFetch } from '../use-fetch'
import { getDataFromTree } from '../ssr'
import { FetchProvider } from '../context-provider'

jest.mock('../src/act-hack')
jest.mock('isomorphic-unfetch', () => jest.fn())
const fetch = (baseFetch as any) as jest.Mock<ReturnType<typeof baseFetch>>

describe('Server Side Rendering Support', () => {
  beforeEach(() => fetch.mockReset())

  test('should be able to wait for queue and extract cache data from tree', async () => {
    fetch.mockImplementation(MultipleOKFetchImplementation(['/foo', '/bar']))
    const client = createClient({})
    const Component = () => {
      const query = useFetch<{ foo: 'bar' }>({
        id: 'foo',
        method: 'GET',
        url: '/foo',
      })
      const query2 = useFetch<{ foo: 'bar' }>({
        id: 'bar',
        method: 'GET',
        url: '/bar',
      })

      return (
        <div>
          {query.data?.foo}+{query2.data?.foo}
        </div>
      )
    }

    const cacheState = await getDataFromTree(
      client,
      <FetchProvider client={client}>
        <Component />
      </FetchProvider>,
    )

    expect(cacheState).toMatchObject({
      foo: {
        value: {
          data: {
            foo: 'bar',
          },
          headers: {},
          status: 200,
        },
        cachedAt: expect.any(Number),
      },
      bar: {
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
})
