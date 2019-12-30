import { useContext } from 'react'
import { FetchContext, FetchContextValue } from './context'
import { FetchDispatcherResult } from './client'

export function useFetchClient<
  TDispatcherResult extends FetchDispatcherResult<any, any>
>() {
  const client: FetchContextValue<TDispatcherResult> | null = useContext(
    FetchContext,
  )

  if (!client) {
    throw new Error(
      'Unable to find fetch client on context. Wrap the app with <FetchProvider/>',
    )
  }

  return client
}
