export interface MockedFetchResult<Payload> {
  status: number
  headers: Headers
  json: Promise<Payload>
}

export const OKFetchImplementation = (input: string): Promise<Response> => {
  if (input === '/foo') {
    return Promise.resolve({
      status: 200,
      headers: {},
      json: () =>
        Promise.resolve({
          foo: 'bar',
        }),
    } as Response)
  }

  return Promise.reject(
    new Error(`Invalid input given. Expected '/foo' found '${input}'`),
  )
}
export const MultipleOKFetchImplementation = (pathnames: string[]) => (
  input: string,
): Promise<Response> => {
  if (pathnames.includes(input)) {
    return Promise.resolve({
      status: 200,
      headers: {},
      json: () =>
        Promise.resolve({
          foo: 'bar',
        }),
    } as Response)
  }

  return Promise.reject(
    new Error(`Invalid input given. Expected '/foo' found '${input}'`),
  )
}
export const BadRequestFetchImplementation = (
  input: string,
): Promise<Response> => {
  if (input === '/foo') {
    return Promise.resolve({
      status: 400,
      headers: {},
      json: () =>
        Promise.resolve({
          error: 'Bad request',
        }),
    } as Response)
  }

  return Promise.reject(
    new Error(`Invalid input given. Expected '/foo' found '${input}'`),
  )
}

export const OKWithHeadersRequestFetchImplementation = (
  input: string,
): Promise<Response> => {
  if (input === '/foo') {
    return Promise.resolve(({
      status: 200,
      headers: {
        'x-test-success': true,
      },
      json: () =>
        Promise.resolve({
          foo: 'bar',
        }),
    } as any) as Response)
  }

  return Promise.reject(
    new Error(`Invalid input given. Expected '/foo' found '${input}'`),
  )
}

export const ErrorRequestFetchImplementation = (
  input: string,
): Promise<Response> => {
  if (input === '/foo') {
    return Promise.reject(new Error('Failed to fetch /foo'))
  }

  return Promise.reject(
    new Error(`Invalid input given. Expected '/foo' found '${input}'`),
  )
}

export const ErrorAtParsingJSONRequestFetchImplementation = (
  input: string,
): Promise<Response> => {
  if (input === '/foo') {
    return Promise.resolve({
      status: 200,
      headers: {},
      json: () => Promise.reject(new Error('Error parsing json')),
    } as Response)
  }

  return Promise.reject(
    new Error(`Invalid input given. Expected '/foo' found '${input}'`),
  )
}
