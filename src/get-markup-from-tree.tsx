import * as React from 'react'
import { createSSRManager, SSRManager } from './internal/ssr-context'
import { isPromiseLike } from './utils'

export const FetchSSRManagerContext = React.createContext<SSRManager | null>(
  null,
)

export interface GetMarkupFromTreeOptions {
  tree: React.ReactNode
  onBeforeRender?: () => void
  renderFunction: (tree: React.ReactElement<object>) => string
}

export default function getMarkupFromTree({
  tree,
  onBeforeRender,
  renderFunction,
}: GetMarkupFromTreeOptions): Promise<string> {
  const ssrManager = createSSRManager()

  function process(): string | Promise<string> {
    try {
      if (onBeforeRender) {
        onBeforeRender()
      }

      const html = renderFunction(
        <FetchSSRManagerContext.Provider value={ssrManager}>
          {tree}
        </FetchSSRManagerContext.Provider>,
      )

      if (!ssrManager.hasPromises()) {
        return html
      }
    } catch (e) {
      if (!isPromiseLike(e)) {
        throw e
      }

      ssrManager.register(e)
    }

    return ssrManager.consumeAndAwaitPromises().then(process)
  }

  return Promise.resolve().then(process)
}
