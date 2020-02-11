import React from 'react'
import { FetchClient, FetchResult } from './client'

export type FetchContextValue<
  TDispatcherResult extends FetchResult<any, any>
> = FetchClient<TDispatcherResult>
export const FetchContext = React.createContext<FetchContextValue<any> | null>(
  null,
)
