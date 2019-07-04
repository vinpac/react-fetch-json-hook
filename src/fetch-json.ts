import fetch from 'isomorphic-fetch'

export default function fetchJSON<Payload>(
  uri: string,
  options: RequestInit,
): Promise<Payload> {
  return fetch(uri, options).then(response => {
    if (response.status === 204) {
      return null
    }

    return response.json()
  })
}
