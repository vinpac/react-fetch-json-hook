import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { FetchClient } from './client'
import { LocalCacheState } from './cache'

export function getDataFromTree(
  client: FetchClient<any>,
  tree: React.ReactElement,
  renderFunction: (tree: React.ReactElement<object>) => any = renderToString,
): Promise<LocalCacheState> {
  renderFunction(tree)
  return client.waitForFetchs().then(() => client.cache.getState())
}
