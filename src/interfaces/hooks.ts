import { FetchAction } from '../action'
import { FetchResult } from '../client'

export interface FetchHookConfig<TMeta> extends FetchAction<TMeta> {
  id?: string
  ssr?: boolean
}

export interface BaseFetchHookResult<TMeta> {
  error?: Error
  loading: boolean
  action?: FetchAction<TMeta>
}

export interface FetchHookState<TValue, TMeta> {
  value?: FetchResult<TValue>
  action?: FetchAction<TMeta>
  loading: boolean
}
