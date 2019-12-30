import React from 'react'
import { FetchClient, FetchDispatcherResult } from './client'

export type FetchContextValue<
  TDispatcherResult extends FetchDispatcherResult<any, any>
> = FetchClient<TDispatcherResult>
export const FetchContext = React.createContext<FetchContextValue<any> | null>(
  null,
)
