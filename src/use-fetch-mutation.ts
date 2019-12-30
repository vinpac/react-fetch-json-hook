import { useCallback, useMemo, useState } from 'react'
import { FetchActionCreator } from './action'
import { actHack } from './act-hack'
import { useFetchClient } from './use-fetch-client'
import { FetchHookResult, FetchHookState } from './interfaces/hooks'
import { FetchDispatcherResult, DefaultFetchDispatcherResult } from './client'

export interface UseBaseFetchMutationResultWithNoExtraValues<
  TValue,
  TArg,
  TMeta
> extends FetchHookResult<TValue, TMeta> {
  mutate: (arg?: TArg) => Promise<TValue>
  reset: () => void
  loading: boolean
}

export type UseBaseFetchMutationResult<TValue, TArg, TMeta> = TValue &
  UseBaseFetchMutationResultWithNoExtraValues<TValue, TArg, TMeta>

export function useBaseFetchMutation<
  TDispatcherResult extends FetchDispatcherResult<any, any>,
  TArg = any,
  TMeta = any
>(
  actionCreator: FetchActionCreator<TArg, TMeta>,
): UseBaseFetchMutationResult<TDispatcherResult, TArg, TMeta> {
  const client = useFetchClient<TDispatcherResult>()
  const [state, setState] = useState<FetchHookState<TDispatcherResult, TMeta>>({
    loading: false,
  })

  const mutate = useCallback(
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
  const result = useMemo<
    UseBaseFetchMutationResult<TDispatcherResult, TArg, TMeta>
  >(
    () =>
      ({
        ...state.value,
        action: state.action,
        loading: state.loading,
        mutate,
        reset,
      } as UseBaseFetchMutationResult<TDispatcherResult, TArg, TMeta>),
    [state, mutate],
  )

  return result
}

export interface UseFetchMutation {
  <TData, TArg = any, TMeta = any>(
    actionCreator: FetchActionCreator<TArg, TMeta>,
  ): UseBaseFetchMutationResult<
    DefaultFetchDispatcherResult<TData>,
    TArg,
    TMeta
  >
}

export const useFetchMutation: UseFetchMutation = useBaseFetchMutation
