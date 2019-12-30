import React from 'react'
import { FetchClient } from '../../src/client'
import { FetchProvider } from '../../src/context-provider'
import {
  renderHook as baseRenderHook,
  RenderHookOptions,
  RenderHookResult,
} from '@testing-library/react-hooks'
import { FetchContextValue } from '../../src/context'

export const createWrapperComponent = (
  client: FetchClient<any>,
): React.ComponentType => {
  const WrapperComponent: React.FC = ({ children }) => (
    <FetchProvider client={client}>{children}</FetchProvider>
  )

  return WrapperComponent
}

interface RenderFetchHookOptions<P> extends RenderHookOptions<P> {
  client: FetchContextValue<any>
}

export const renderFetchHook = <P, R>(
  fn: (props: P) => R,
  { client, wrapper, ...options }: RenderFetchHookOptions<P>,
): RenderHookResult<P, R> =>
  baseRenderHook<P, R>(fn, {
    ...options,
    wrapper: wrapper || createWrapperComponent(client),
  })
