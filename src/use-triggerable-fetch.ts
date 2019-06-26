import { useCallback, useContext, useMemo, useState } from 'react'
import fetchJSON from './fetch-json'
import FetchConnectorContext from './FetchConnectorContext'
import actHack from './internal/actHack'

interface MutationFetchHookState<Payload> {
  data?: Payload
  loading: boolean
  error?: Error
}

export default function useTriggerableFetch<Payload>(
  url: string,
  defaultOptions?: RequestInit,
) {
  const fetchConnector = useContext(FetchConnectorContext)

  if (!fetchConnector) {
    throw new Error(
      'useFetch should not be used outside <FetchConnectorContext.Provider />',
    )
  }

  const [state, setState] = useState<MutationFetchHookState<Payload>>({
    loading: false,
  })
  const trigger = useCallback(
    async (body?: any, options?: RequestInit) => {
      actHack(() => setState({ loading: true }))
      try {
        const data: Payload = await fetchJSON(url, {
          ...defaultOptions,
          ...options,
          headers: {
            ...fetchConnector.requestHeaders,
            ...(defaultOptions && defaultOptions.headers),
            ...(options && options.headers),
          },
          body,
        })
        actHack(() => setState({ data, loading: false }))

        return data
      } catch (error) {
        actHack(() => setState({ error, loading: false }))
        return error
      }
    },
    [url, setState],
  )
  const result = useMemo(() => ({ ...state, trigger }), [state, trigger])

  return result
}
