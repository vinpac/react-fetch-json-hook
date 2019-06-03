import queryString from 'querystring'

export default function createQueryCacheId(
  uri: string,
  options?: RequestInit,
): string {
  let str = `${options && options.method ? options.method : 'GET'}:${uri}`
  let body: any

  if (options) {
    if (options.body) {
      if (options.body instanceof FormData) {
        body = {}
        options.body.forEach((value, k) => {
          body[k] = value
        })
      } else {
        body = options.body
      }

      const bodyStr = queryString.stringify(body)

      if (bodyStr) {
        str += `@BODY:${bodyStr}`
      }
    }
  }

  return str
}
