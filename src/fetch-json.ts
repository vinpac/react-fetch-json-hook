import fetch from 'isomorphic-fetch'

export default function fetchJSON<Payload>(
  uri: string,
  options: RequestInit,
): Promise<Payload> {
  return fetch(uri, options).then(response => response.json())
}
