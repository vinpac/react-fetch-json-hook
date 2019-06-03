import React from 'react'
import { renderToString } from 'react-dom/server'
import { createFetchConnector } from '../fetch-connector'
import getMarkupFromTree from '../get-markup-from-tree'
import { FetchHookProvider } from '../index'
import useFetch from '../use-fetch'

jest.mock('../internal/actHack')
jest.mock('../fetch-json')

describe('SSR', () => {
  test('should getMarkupFromTree without error', async () => {
    const connector = createFetchConnector()
    const Hello = () => {
      const { data } = useFetch('/foo')
      return <div>{data && data.join(',')}</div>
    }

    const renderedHtml = await getMarkupFromTree({
      renderFunction: renderToString,
      tree: (
        <FetchHookProvider connector={connector}>
          <Hello />
        </FetchHookProvider>
      ),
    })

    expect(renderedHtml).toEqual('<div>1,2,3</div>')
    expect(connector.cache.state).toEqual({
      'GET:/foo': { payload: [1, 2, 3] },
    })
  })
})
