import { FetchClient, FetchResult } from './client'

const IS_SERVER = typeof window === 'undefined'
let client: FetchClient<any> | undefined
export function registerClientForLocalMutations(fetchClient: FetchClient<any>) {
  if (IS_SERVER) {
    throw new Error(
      'Fetch client was registered on server for local mutations. This leads to incosistency, thus is not allowed',
    )
  }

  client = fetchClient
}

export function removeRegisteredClientForLocalMutations() {
  client = undefined
}

export function mutateFetchCache<TValue>(
  fetchId: string,
  overrideOrUpdateValue:
    | ((newValue: FetchResult<TValue>) => TValue)
    | FetchResult<TValue>,
) {
  if (!client) {
    throw new Error('Fetch client was not registered for local mutations')
  }

  client.set(
    fetchId,
    typeof overrideOrUpdateValue === 'function'
      ? overrideOrUpdateValue
      : (prevValue: TValue) => ({
          ...prevValue,
          ...overrideOrUpdateValue,
        }),
  )
}
