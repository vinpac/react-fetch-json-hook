import React from 'react'
import { renderHook } from 'react-hooks-testing-library'
import mockedResponse from '../__mocks__/mocked-response.json'
import { createFetchConnector, FetchConnector } from '../fetch-connector'
import fetchJSON from '../fetch-json'
import FetchConnectorContext from '../FetchConnectorContext'
import useTriggerableFetch from '../use-triggerable-fetch'

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

describe('UseTriggerableFetchHook', () => {
  test('should fetch without error', async () => {
    const connector = createFetchConnector()
    const hook = renderHook(() => useTriggerableFetch('/foo'), {
      wrapper: createWrapperComponent(connector),
    })

    expect(hook.result.current.error).toEqual(undefined)
    expect(hook.result.current.data).toEqual(undefined)
    expect(typeof hook.result.current.trigger).toEqual('function')
    expect(hook.result.current.loading).toEqual(false)
    hook.result.current.trigger()
    expect(hook.result.current.error).toEqual(undefined)
    expect(hook.result.current.data).toEqual(undefined)
    expect(typeof hook.result.current.trigger).toEqual('function')
    expect(hook.result.current.loading).toEqual(true)
    await hook.waitForNextUpdate()
    expect(hook.result.current.error).toEqual(undefined)
    expect(hook.result.current.data).toEqual(mockedResponse['/foo'])
    expect(typeof hook.result.current.trigger).toEqual('function')
    expect(hook.result.current.loading).toEqual(false)
    expect(mockedFetchJSON.mock.calls.length).toBe(1)
  })
})
