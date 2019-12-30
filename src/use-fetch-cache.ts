import { useEffect, useMemo, useCallback, useState } from 'react'
import { useFetchClient } from './use-fetch-client'
import { actHack } from './act-hack'
import { FetchDispatcherResult, DefaultFetchDispatcherResult } from './client'

export interface MutateCachedValueFn<
  TDispatcherResult extends FetchDispatcherResult<any, any>
> {
  (newValue: Partial<TDispatcherResult>): void
}
export function useBaseFetchCache<
  TDispatcherResult extends FetchDispatcherResult<any, any>
>(fetchId: string) {
  const client = useFetchClient<TDispatcherResult>()

  const [value, setValue] = useState(client.get(fetchId))
  useEffect(
    () =>
      client.listen(fetchId, {
        update: newValue => {
          actHack(() => setValue(newValue))
        },
      }),
    [client, fetchId, setValue],
  )
  const updateCacheValue = useCallback(
    newValue =>
      client.set(fetchId, prevValue => ({ ...prevValue, ...newValue })),
    [client],
  )

  return useMemo<
    [TDispatcherResult | undefined, MutateCachedValueFn<TDispatcherResult>]
  >(() => [value, updateCacheValue], [client, value])
}

export interface UseFetchCache {
  <TData>(fetchId: string): [
    DefaultFetchDispatcherResult<TData> | undefined,
    MutateCachedValueFn<DefaultFetchDispatcherResult<TData>>,
  ]
}

export const useFetchCache: UseFetchCache = useBaseFetchCache
