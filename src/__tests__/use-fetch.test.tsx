import React from 'react'
import { renderHook } from 'react-hooks-testing-library'
import mockedResponse from '../__mocks__/mocked-response.json'
import { createFetchConnector, FetchConnector } from '../fetch-connector'
import fetchJSON from '../fetch-json'
import useFetch, { FetchConnectorContext } from '../use-fetch'

jest.mock('../internal/actHack')
jest.mock('../fetch-json')

const mockedFetchJSON = (fetchJSON as unknown) as jest.Mock<typeof fetchJSON>

const createWrapperComponent = (connector: FetchConnector) => {
  const WrapperComponent: React.FC<{ children?: React.ReactNode }> = ({
    children,
  }) => (
    <FetchConnectorContext.Provider value={connector}>
      {children}
    </FetchConnectorContext.Provider>
  )

  return WrapperComponent
}

describe('UseFetchHook', () => {
  test('should fetch without error', async () => {
    const connector = createFetchConnector()
    const hook1 = renderHook(() => useFetch('/foo'), {
      wrapper: createWrapperComponent(connector),
    })

    expect(hook1.result.current.data).toEqual(undefined)
    expect(hook1.result.current.error).toEqual(undefined)
    expect(hook1.result.current.loading).toEqual(true)
    await hook1.waitForNextUpdate()
    expect(hook1.result.current.data).toEqual(mockedResponse['/foo'])
    expect(hook1.result.current.error).toEqual(undefined)
    expect(hook1.result.current.loading).toEqual(false)
  })

  test('should not re-fetch if cached', async () => {
    const connector = createFetchConnector()
    const hook1 = renderHook(() => useFetch('/foo'), {
      wrapper: createWrapperComponent(connector),
    })

    expect(hook1.result.current.data).toEqual(undefined)
    expect(hook1.result.current.error).toEqual(undefined)
    expect(hook1.result.current.loading).toEqual(true)
    await hook1.waitForNextUpdate()
    expect(hook1.result.current.data).toEqual(mockedResponse['/foo'])
    expect(hook1.result.current.error).toEqual(undefined)
    expect(hook1.result.current.loading).toEqual(false)

    const hook2 = renderHook(() => useFetch('/foo'), {
      wrapper: createWrapperComponent(connector),
    })
    expect(hook2.result.current.data).toEqual(mockedResponse['/foo'])
    expect(hook2.result.current.error).toEqual(undefined)
    expect(hook2.result.current.loading).toEqual(false)
    expect(connector.cache.state).toEqual({
      'GET:/foo': { payload: mockedResponse['/foo'] },
    })
  })

  test('should catch error', async () => {
    const connector = createFetchConnector()
    const hook1 = renderHook(() => useFetch('/not-found'), {
      wrapper: createWrapperComponent(connector),
    })
    await hook1.waitForNextUpdate()
    expect(hook1.result.current.data).toEqual(undefined)
    expect(hook1.result.current.error).toBeInstanceOf(Error)
    expect(hook1.result.current.error!.message).toEqual('Not Found')
    expect(hook1.result.current.loading).toEqual(false)
  })

  test('should only fetch once if fetching at the same time', async () => {
    mockedFetchJSON.mockClear()

    const connector = createFetchConnector()
    await Promise.all(
      [1, 2, 3, 4].map(
        () =>
          renderHook(() => useFetch('/foo'), {
            wrapper: createWrapperComponent(connector),
          }).waitForNextUpdate,
      ),
    )
    expect(mockedFetchJSON.mock.calls.length).toBe(1)
  })

  test('should fetch more and update result data', async () => {
    mockedFetchJSON.mockClear()

    const connector = createFetchConnector()
    const { result, waitForNextUpdate } = renderHook(
      () => useFetch<Array<{ name: string }>>('/foo'),
      {
        wrapper: createWrapperComponent(connector),
      },
    )

    await waitForNextUpdate()
    expect(result.current.data).toEqual(mockedResponse['/foo'])
    result.current.fetchMore(hookResult => {
      if (!hookResult.loading) {
        return {
          uri: '/bar',
          updateData: (nextData, prevData) => [...prevData, ...nextData],
        }
      }
    })
    expect(result.current.data).toEqual(mockedResponse['/foo'])
    expect(result.current.loading).toEqual(true)
    expect(result.current.error).toEqual(undefined)
    await waitForNextUpdate()
    expect(result.current.data).toEqual([
      ...mockedResponse['/foo'],
      ...mockedResponse['/bar'],
    ])
    expect(result.current.loading).toEqual(false)
    expect(result.current.error).toEqual(undefined)

    expect(mockedFetchJSON.mock.calls.length).toBe(2)
  })

  test('should not fire an update if params changed before resolving', async () => {
    mockedFetchJSON.mockClear()

    const connector = createFetchConnector()
    const { result, rerender, waitForNextUpdate } = renderHook(
      ({ url }) => useFetch(url),
      {
        wrapper: createWrapperComponent(connector),
        initialProps: {
          url: '/foo',
        },
      },
    )
    expect(result.current.data).toEqual(undefined)
    expect(result.current.error).toEqual(undefined)
    expect(result.current.loading).toEqual(true)
    rerender({ url: '/bar' })
    await waitForNextUpdate()
    expect(result.current.data).toEqual(mockedResponse['/bar'])
    expect(result.current.error).toEqual(undefined)
    expect(result.current.loading).toEqual(false)
  })

  test('should uncache by uri if exceeds stack limit', async () => {
    mockedFetchJSON.mockClear()

    const connector = createFetchConnector()
    const { result, rerender, waitForNextUpdate } = renderHook(
      ({ url }) => useFetch(url),
      {
        wrapper: createWrapperComponent(connector),
        initialProps: {
          url: '/foo',
        },
      },
    )
    const routes = ['/bar', '/zip', '/zop']
    await Promise.all(
      routes.map(route => {
        rerender({ url: route })
        return waitForNextUpdate()
      }),
    )

    // We expect here to re-fetch
    rerender({ url: '/foo' })
    expect(result.current.data).toEqual(undefined)
    expect(result.current.error).toEqual(undefined)
    expect(result.current.loading).toEqual(true)
    await waitForNextUpdate()
    expect(result.current.data).toEqual(mockedResponse['/foo'])
    expect(result.current.error).toEqual(undefined)
    expect(result.current.loading).toEqual(false)
    expect(connector.cache.stack).toEqual(['GET:/zip', 'GET:/zop', 'GET:/foo'])
  })

  test('should uncache correctly after fetchMore', async () => {
    mockedFetchJSON.mockClear()

    const connector = createFetchConnector()
    const { result, rerender, waitForNextUpdate } = renderHook(
      ({ url }) => useFetch<any[]>(url),
      {
        wrapper: createWrapperComponent(connector),
        initialProps: {
          url: '/foo',
        },
      },
    )
    await waitForNextUpdate()
    result.current.fetchMore(hookResult => {
      if (!hookResult.loading) {
        return {
          uri: '/2',
          updateData: (nextData, prevData) => [...prevData, ...nextData],
        }
      }
    })
    await waitForNextUpdate()
    rerender({ url: '/bar' })
    await waitForNextUpdate()
    rerender({ url: '/laz' })
    await waitForNextUpdate()
    rerender({ url: '/zap' })
    await waitForNextUpdate()
    expect(connector.cache.stack).toEqual(['GET:/bar', 'GET:/laz', 'GET:/zap'])
  })

  test('should not uncache if multiple hooks are using the same cache and one unmounts', async () => {
    mockedFetchJSON.mockClear()

    const connector = createFetchConnector()
    const hook1 = renderHook(() => useFetch<any[]>('/foo'), {
      wrapper: createWrapperComponent(connector),
    })
    const hook2 = renderHook(() => useFetch<any[]>('/foo'), {
      wrapper: createWrapperComponent(connector),
    })
    await Promise.all([hook1.waitForNextUpdate(), hook2.waitForNextUpdate()])
    const cacheState = { ...connector.cache.state }
    hook1.unmount()

    expect(cacheState).toEqual(connector.cache.state)
  })

  test("should not uncache fetch more's data if the primary query id don't exceed stack size", async () => {
    mockedFetchJSON.mockClear()

    const connector = createFetchConnector()
    const hook1 = renderHook(
      ({ url }) => useFetch<any[]>(url, { stackSize: 2 }),
      {
        wrapper: createWrapperComponent(connector),
        initialProps: {
          url: '/foo',
        },
      },
    )
    await hook1.waitForNextUpdate()
    hook1.result.current.fetchMore(() => ({
      uri: '/bar',
      updateData: (nextData, prevData) => [...prevData, ...nextData],
    }))
    await hook1.waitForNextUpdate()
    hook1.rerender({ url: '/zip' })
    await hook1.waitForNextUpdate()
    hook1.rerender({ url: '/foo' })
    expect(connector.cache.stack).toEqual(['GET:/foo', 'GET:/bar', 'GET:/zip'])

    expect(connector.cache.state).toEqual({
      'GET:/foo': { payload: mockedResponse['/foo'] },
      'GET:/bar': { payload: mockedResponse['/bar'] },
      'GET:/zip': { payload: mockedResponse['/zip'] },
    })
  })

  test('should uncache every instance of an cache item unmounts', async () => {
    mockedFetchJSON.mockClear()

    const connector = createFetchConnector()
    const hook1 = renderHook(
      ({ url }) => useFetch<any[]>(url, { stackSize: 2 }),
      {
        wrapper: createWrapperComponent(connector),
        initialProps: {
          url: '/foo',
        },
      },
    )
    await hook1.waitForNextUpdate()
    hook1.result.current.fetchMore(() => ({
      uri: '/bar',
      updateData: (nextData, prevData) => [...prevData, ...nextData],
    }))
    await hook1.waitForNextUpdate()
    hook1.rerender({ url: '/zip' })
    await hook1.waitForNextUpdate()
    hook1.result.current.fetchMore(() => ({
      uri: '/zop',
      updateData: (nextData, prevData) => [...prevData, ...nextData],
    }))
    await hook1.waitForNextUpdate()
    hook1.rerender({ url: '/foo' })
    hook1.result.current.fetchMore(() => ({
      uri: '/zup',
      updateData: (nextData, prevData) => [...prevData, ...nextData],
    }))
    await hook1.waitForNextUpdate()
    hook1.rerender({ url: '/mop' })
    await hook1.waitForNextUpdate()
    hook1.rerender({ url: '/kit' })
    await hook1.waitForNextUpdate()

    expect(connector.cache.stack).toEqual(['GET:/mop', 'GET:/kit'])
    expect(connector.cache.state).toEqual({
      'GET:/mop': { payload: mockedResponse['/mop'] },
      'GET:/kit': { payload: mockedResponse['/kit'] },
    })
  })

  test('should not fetch if valid initial state is provided', async () => {
    const connector = createFetchConnector({
      initialState: {
        state: {
          'GET:/foo': {
            payload: mockedResponse['/foo'],
          },
        },
        stack: ['GET:/foo'],
      },
    })
    const hook1 = renderHook(() => useFetch('/foo'), {
      wrapper: createWrapperComponent(connector),
    })
    expect(hook1.result.current.data).toEqual(mockedResponse['/foo'])
    expect(hook1.result.current.error).toEqual(undefined)
    expect(hook1.result.current.loading).toEqual(false)

    expect(connector.cache.state).toEqual({
      'GET:/foo': {
        payload: mockedResponse['/foo'],
      },
    })
    expect(connector.cache.stack).toEqual(['GET:/foo'])
  })
})
