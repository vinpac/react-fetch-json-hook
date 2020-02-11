import { useEffect, useState, useMemo, useCallback } from 'react'
import { actHack } from './act-hack'
import { useFetchClient } from './use-fetch-client'
import {
  FetchHookConfig,
  BaseFetchHookResult,
  FetchHookState,
} from './interfaces/hooks'
import { FetchResult, DefaultFetchDispatcherResult } from './client'

interface UseBaseFetchResultWithoutExtraValues<TValue, TMeta>
  extends BaseFetchHookResult<TMeta> {
  refetch: () => Promise<TValue>
}

type UseBaseFetchResult<TValue, TMeta> = TValue &
  UseBaseFetchResultWithoutExtraValues<TValue, TMeta>

interface State<TValue, TMeta> extends FetchHookState<TValue, TMeta> {
  lastFetchedFetchId?: string
}
export function useBaseFetch<
  TDispatcherResult extends FetchResult<any, any>,
  TMeta = any
>(
  config: FetchHookConfig<TMeta> | null,
): UseBaseFetchResult<TDispatcherResult, TMeta> {
  const client = useFetchClient<TDispatcherResult>()
  const fetchId = config ? config.id || client.idFromAction(config) : undefined
  const cachedValue = fetchId ? client.get(fetchId) : undefined
  const [state, setState] = useState<State<TDispatcherResult, TMeta>>({
    value: cachedValue,
    loading: !cachedValue,
    lastFetchedFetchId: cachedValue ? fetchId : undefined,
  })
  const dispatchAction = useCallback(() => {
    if (!config) {
      return Promise.reject(new Error('action is null'))
    }

    // if (!state.loading) {
    //   setState(prevState => ({ ...prevState, loading: true }))
    // }

    return client
      .dispatch(config, fetchId)
      .catch((error: Error) => {
        actHack(() => {
          setState({ value: { error }, action: config, loading: false })
        })

        throw error
      })
      .then(result => {
        actHack(() => {
          setState({ value: result, action: config, loading: false })
        })

        return result
      })
  }, [fetchId])
  useMemo(() => {
    if (fetchId !== state.lastFetchedFetchId) {
      dispatchAction()
    }
  }, [client, fetchId])
  useEffect(() => {
    if (fetchId) {
      const unlisten = client.listen(fetchId, {
        update: newValue => {
          actHack(() => {
            setState({
              loading: false,
              value: newValue,
            })
          })
        },
      })

      if (config && !cachedValue) {
        if (state.loading !== true) {
          setState({ action: config, loading: true })
        }
      }

      return unlisten
    }
  }, [client, fetchId])
  const result = useMemo<UseBaseFetchResult<TDispatcherResult, TMeta>>(
    () =>
      ({
        ...state.value,
        action: config || undefined,
        loading: state.loading,
        refetch: dispatchAction,
      } as UseBaseFetchResult<TDispatcherResult, TMeta>),
    [state],
  )

  return result
}

interface UseFetch {
  <TData, TMeta = any>(
    config: FetchHookConfig<TMeta> | null,
  ): UseBaseFetchResult<DefaultFetchDispatcherResult<TData>, TMeta>
}

export const useFetch: UseFetch = useBaseFetch
