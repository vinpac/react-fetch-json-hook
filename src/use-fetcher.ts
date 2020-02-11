import { useCallback, useMemo, useState } from 'react'
import { FetchActionCreator } from './action'
import { actHack } from './act-hack'
import { useFetchClient } from './use-fetch-client'
import { BaseFetchHookResult, FetchHookState } from './interfaces/hooks'
import { FetchDispatcherResult, DefaultFetchDispatcherResult } from './client'

export interface UseBaseFetcherResultWithNoExtraValues<TValue, TArg, TMeta>
  extends BaseFetchHookResult<TMeta> {
  fetch: (arg?: TArg) => Promise<TValue>
  reset: () => void
  loading: boolean
}

export type UseBaseFetcherResult<TValue, TArg, TMeta> = TValue &
  UseBaseFetcherResultWithNoExtraValues<TValue, TArg, TMeta>

export function useBaseFetcher<
  TDispatcherResult extends FetchDispatcherResult<any, any>,
  TArg = any,
  TMeta = any
>(
  actionCreator: FetchActionCreator<TArg, TMeta>,
): UseBaseFetcherResult<TDispatcherResult, TArg, TMeta> {
  const client = useFetchClient<TDispatcherResult>()
  const [state, setState] = useState<FetchHookState<TDispatcherResult, TMeta>>({
    loading: false,
  })

  const callback = useCallback(
    (arg?: TArg) => {
      try {
        const action = actionCreator(arg)

        if (action === null) {
          return
        }

        actHack(() => setState({ action, loading: true }))
        return client
          .dispatch(action)
          .catch((error: Error) => {
            actHack(() => {
              setState({ value: { error }, action, loading: false })
            })

            throw error
          })
          .then(result => {
            actHack(() => {
              setState({ value: result, action, loading: false })
            })

            if (result.error) {
              throw result.error
            }

            return result.data
          })
      } catch (error) {
        actHack(() => {
          setState({ value: { error }, loading: false })
        })
        return error
      }
    },
    [actionCreator],
  )

  const reset = useCallback(() => setState({ loading: false }), [setState])
  const result = useMemo<UseBaseFetcherResult<TDispatcherResult, TArg, TMeta>>(
    () =>
      ({
        ...state.value,
        action: state.action,
        loading: state.loading,
        fetch: callback,
        reset,
      } as UseBaseFetcherResult<TDispatcherResult, TArg, TMeta>),
    [state, callback],
  )

  return result
}

export interface UseFetcher {
  <TData, TArg = any, TMeta = any>(
    actionCreator: FetchActionCreator<TArg, TMeta>,
  ): UseBaseFetcherResult<DefaultFetchDispatcherResult<TData>, TArg, TMeta>
}

export const useFetcher: UseFetcher = useBaseFetcher
