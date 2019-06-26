import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import createQueryCacheId from './create-query-cache-id'
import {
  FetchConnector,
  registerItemToFetchConnector,
  uncacheQueries,
} from './fetch-connector'
import fetchConnectorContext from './FetchConnectorContext'
import { FetchSSRManagerContext } from './get-markup-from-tree'
import actHack from './internal/actHack'

export interface FetchMorePlan<Payload, NextPayload> extends RequestInit {
  uri: string
  updateData: (nextData: NextPayload, prevData: Payload) => Payload
}

interface Helpers<Payload> {
  fetchMore: <NextPayload = Payload>(
    fn: (
      currentResult: FetchHookResultBase<Payload>,
    ) => FetchMorePlan<Payload, NextPayload> | void,
  ) => void
}

export type FetchHookResultBase<Payload> =
  | {
      readonly data: Payload
      readonly loading: boolean
      readonly error: undefined
    }
  | {
      readonly data: undefined
      readonly loading: boolean
      readonly error: Error
    }
  | {
      readonly data: undefined
      readonly loading: boolean
      readonly error: undefined
    }

export type FetchHookResult<Payload> = FetchHookResultBase<Payload> &
  Helpers<Payload>

const incrementResponseId = (x: number) => x + 1

export type UseFetchOptions = RequestInit & {
  ssr?: boolean
  skip?: boolean
  stackSize?: number
}

function getQueryResult<Payload>(
  fetchConnector: FetchConnector,
  queryId: string,
  options?: UseFetchOptions,
): FetchHookResultBase<Payload> {
  if (options && options.skip) {
    return {
      loading: false,
      error: undefined,
      data: undefined,
    }
  }

  const cacheItem = fetchConnector.cache.state[queryId]

  return {
    loading: Boolean(cacheItem.promise),
    error: cacheItem.error!,
    data: cacheItem.payload,
  }
}

/**
 *
 * @param uri URI to be fetched from
 * @param options It's good practice to memoize this param
 */
export default function useFetch<Payload>(
  uri: string,
  options?: UseFetchOptions,
): FetchHookResult<Payload> {
  const { stackSize = 3 } = options || {}
  const fetchConnector = useContext(fetchConnectorContext)
  const ssrManager = useContext(FetchSSRManagerContext)
  const queryId = useMemo(() => createQueryCacheId(uri, options), [
    uri,
    options,
  ])
  const queriesIdsRef = useRef<string[]>([queryId])
  const localStack = useRef<string[][]>([queriesIdsRef.current])

  if (!fetchConnector) {
    throw new Error(
      'useFetch should not be used outside <FetchConnectorContext.Provider />',
    )
  }

  let queryIdChanged = false
  if (queryId !== queriesIdsRef.current[0]) {
    queryIdChanged = true
    queriesIdsRef.current = [queryId]

    let identicalMainQueryIdsListIndex = -1
    const identicalMainQueryIdsList = localStack.current.find(
      (queriesIds, index) => {
        if (queriesIds[0] === queryId) {
          identicalMainQueryIdsListIndex = index
          return true
        }

        return false
      },
    )

    if (identicalMainQueryIdsList) {
      localStack.current.splice(identicalMainQueryIdsListIndex, 1)
      localStack.current.push(identicalMainQueryIdsList)

      queriesIdsRef.current = identicalMainQueryIdsList
    } else {
      localStack.current.push(queriesIdsRef.current)
    }

    if (localStack.current.length > stackSize) {
      const poppedQueriesIds = localStack.current[0]
      localStack.current = localStack.current.slice(
        localStack.current.length - stackSize,
      )
      uncacheQueries(fetchConnector, poppedQueriesIds)
    }
  }

  useMemo(() => {
    if (options && options.skip) {
      return
    }

    const promise = registerItemToFetchConnector(
      fetchConnector,
      queryId,
      uri,
      options,
    )

    const handle = (payload: any, isError?: boolean) => {
      // Prevent re-render when key changed before promise was resolved
      if (queryId !== queriesIdsRef.current[0]) {
        return
      }

      fetchConnector.cache.state[queryId] = isError
        ? { error: payload }
        : { payload }

      const cacheItem = fetchConnector.cache.state[queryId]
      // We use actHack to supress react-test-renderer warning
      actHack(() => {
        resultRef.current = {
          loading: false,
          error: cacheItem.error!,
          data: cacheItem.payload,
        }
        setResponseId(incrementResponseId)
      })
    }

    if (promise) {
      promise!.then(handle).catch(error => handle(error, true))

      if (ssrManager && (!options || options.ssr !== false)) {
        ssrManager.register(promise)
      }
    }
  }, [queryId, options, options && options.skip])

  // Use response id to re-render component when something changes
  const [, setResponseId] = useState(0)
  const syncedResult = getQueryResult<Payload>(fetchConnector, queryId, options)
  const resultRef = useRef<FetchHookResultBase<Payload>>(syncedResult)
  if (queryIdChanged) {
    resultRef.current = syncedResult
  }

  const currentResult: FetchHookResult<Payload> = useMemo(() => {
    const helpers: Helpers<Payload> = {
      fetchMore: fn => {
        const plan = fn(resultRef.current)

        if (plan && plan.uri) {
          const nextQueryId = createQueryCacheId(plan.uri, plan)
          const promise = registerItemToFetchConnector(
            fetchConnector,
            nextQueryId,
            plan.uri,
            plan,
          )
          queriesIdsRef.current.push(nextQueryId)

          if (promise) {
            // We use actHack to supress react-test-renderer warning
            actHack(() => {
              resultRef.current = {
                ...resultRef.current,
                loading: true,
              } as FetchHookResultBase<Payload>
              setResponseId(incrementResponseId)
            })
          }

          const handle = (payload?: any, isError?: boolean) => {
            if (payload) {
              fetchConnector.cache.state[nextQueryId] = isError
                ? { error: payload }
                : { payload }
            }
            // Prevent re-render when key changed before promise was resolved
            if (queryId !== queriesIdsRef.current[0]) {
              return
            }

            const cacheItem = fetchConnector.cache.state[nextQueryId]

            // We use actHack to supress react-test-renderer warning
            actHack(() => {
              resultRef.current = {
                loading: false,
                error: cacheItem.error!,
                data: cacheItem.error
                  ? resultRef.current.data
                  : plan.updateData(cacheItem.payload, resultRef.current.data!),
              } as FetchHookResultBase<Payload>
              setResponseId(incrementResponseId)
            })
          }

          if (promise) {
            return promise!.then(handle).catch(error => handle(error, true))
          } else {
            handle()
          }
        }
      },
    }

    return {
      ...helpers,
      ...resultRef.current,
    }
  }, [queryId, resultRef.current])

  return currentResult
}
