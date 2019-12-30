const IS_SERVER = typeof window === 'undefined'
import { FetchClient } from './client'

let client: FetchClient<any> | undefined
export function registerClientForLocalMutations(fetchClient: FetchClient<any>) {
  if (IS_SERVER) {
    throw new Error(
      'Fetch client was registered on server for local mutations. This leads to incosistency, thus is not allowed',
    )
  }

  client = fetchClient
}

export function mutate<TValue>(
  fetchId: string,
  overrideOrUpdateValue: ((newValue: TValue) => TValue) | TValue,
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
