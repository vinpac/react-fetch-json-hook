import fetchJSON from './fetch-json'

export interface FetchConnectorState {
  [key: string]: {
    error?: Error
    payload?: any
    promise?: Promise<any>
  }
}

export interface FetchConnectorCache {
  stack: string[]
  state: FetchConnectorState
}

export interface FetchConnector {
  requestHeaders?: object
  cache: FetchConnectorCache
}

interface FetchConnectorOptions {
  requestHeaders?: object
  initialState?: FetchConnectorCache
}

export const createFetchConnector = ({
  requestHeaders,
  initialState,
}: FetchConnectorOptions = {}): FetchConnector => ({
  requestHeaders,
  cache: {
    state: (initialState && initialState.state) || {},
    stack: (initialState && initialState.stack) || [],
  },
})

export function registerItemToFetchConnector<Payload>(
  connector: FetchConnector,
  queryId: string,
  uri: string,
  options?: RequestInit,
): Promise<Payload> | undefined {
  const { cache } = connector

  if (cache.state[queryId]) {
    return cache.state[queryId].promise
  }

  const fetchOptions = options || {}

  // Add authorization header
  if (connector.requestHeaders) {
    fetchOptions.headers = {
      ...fetchOptions.headers,
      ...connector.requestHeaders,
    }
  }

  const promise = fetchJSON<Payload>(uri, fetchOptions)

  cache.state[queryId] = { promise: promise! }
  cache.stack.push(queryId)

  return promise
}

export function uncacheQueries<Payload>(
  connector: FetchConnector,
  queriesIds: string[],
): void {
  const { cache } = connector

  const queryIdsToRemove = [...queriesIds]
  const queriesRemovedFromGlobalStack: string[] = []
  cache.stack = cache.stack.filter((globalStackedQueryId, i) => {
    if (queriesIds.includes(globalStackedQueryId)) {
      const index = queriesRemovedFromGlobalStack.indexOf(globalStackedQueryId)

      // Remove from global stack
      if (index === -1) {
        // We push to this array so we know this query id was already removed
        queriesRemovedFromGlobalStack.push(globalStackedQueryId)

        return false
      } else {
        // If we found a second match we don't want to remove it from the cache now
        const toRemoveIndex = queryIdsToRemove.indexOf(globalStackedQueryId)

        if (toRemoveIndex !== -1) {
          queryIdsToRemove.splice(toRemoveIndex, 1)
        }
      }
    }

    return true
  })

  if (queryIdsToRemove.length) {
    queryIdsToRemove.forEach(queryId => {
      delete cache.state[queryId]
    })
  }
}
