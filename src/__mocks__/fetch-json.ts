import mockedResponse from './mocked-response.json'

export default jest.fn((uri: string) => {
  if (uri in mockedResponse) {
    return Promise.resolve(mockedResponse[uri as keyof typeof mockedResponse])
  }

  return Promise.reject(new Error('Not Found'))
})
