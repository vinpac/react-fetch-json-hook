import { FetchCache, createCache, LocalCacheState } from './cache'
import { FetchAction } from './action'
import mitt from 'mitt'
import fetch from 'isomorphic-unfetch'

export interface FetchDispatcher<TResult extends FetchResult<any, any>> {
  (action: FetchAction<any>): Promise<TResult>
}

export type FetchResult<TData, TContext = {}> = {
  error?: Error
  data?: TData
} & TContext

export interface HeadersObject {
  [headerName: string]: any
}

export type DefaultFetchDispatcherResult<TData> = FetchResult<
  TData,
  {
    status?: number
    headers?: HeadersObject
  }
>
export const defaultDispatcher: FetchDispatcher<DefaultFetchDispatcherResult<
  any
>> = action =>
  fetch(action.url, action)
    .then(resp =>
      resp
        .json()
        .then(data => ({
          data,
          status: resp.status,
          headers: { ...resp.headers },
        }))
        .catch(error => ({
          error,
          status: resp.status,
          headers: { ...resp.headers },
        })),
    )
    .catch(error => ({
      error,
      status: error.status,
      headers: error.headers,
    }))
export interface IdFromActionFn {
  (action: FetchAction<any>): string
}
const defaultIdFromAction: IdFromActionFn = action => action.url

export interface ShouldCacheFetchResultFn {
  (action: FetchAction<any>): boolean
}

const defaultShouldCacheAction: ShouldCacheFetchResultFn = action =>
  action.method === 'GET'

interface EventHandlersMap {
  update?: (newValue: any) => void
  revalidate?: () => void
}

export class FetchClient<TDispatcherResult extends FetchResult<any, any>> {
  /**
   * A function that creates an id from an action
   *
   * @type {IdFromActionFn}
   * @memberof FetchClient
   */
  public idFromAction: IdFromActionFn
  /**
   * A function that tells the client if it should cache the action result
   *
   * @type {ShouldCacheFetchResultFn}
   * @memberof FetchClient
   */
  public shouldCacheFetchResult: ShouldCacheFetchResultFn
  /**
   * An object that matches the action id to its promise on queue
   *
   * @protected
   * @type {{ [fetchId in string]: Promise<any> }}
   * @memberof FetchClient
   */
  protected queueMap: {
    [fetchId in string]: Promise<TDispatcherResult>
  }

  /**
   * Mitt instance that handles all events
   * @protected
   * @type {mitt.Emitter}
   * @memberof FetchClient
   */
  protected emitter: mitt.Emitter
  constructor(
    public cache: FetchCache<TDispatcherResult, any>,
    protected dispatcher: FetchDispatcher<TDispatcherResult>,
    idFromAction?: IdFromActionFn,
    shouldCacheAction?: ShouldCacheFetchResultFn,
  ) {
    this.idFromAction = idFromAction || defaultIdFromAction
    this.shouldCacheFetchResult = shouldCacheAction || defaultShouldCacheAction
    this.queueMap = {}
    this.emitter = mitt()
  }
  /**
   * Dispatchs an action and adds it to queue. If an equal action, compared by id, is found
   * we reuse the same promise and return it. When resolved we emit to all listeners that
   * the value has changed.
   * @param action Action to be dispatch
   */
  dispatch(
    action: FetchAction<any>,
    givenCacheId?: string,
  ): Promise<TDispatcherResult> {
    const fetchId = givenCacheId || this.idFromAction(action)

    // Return promise in queue if it exists
    if (this.queueMap[fetchId]) {
      return this.queueMap[fetchId]
    }

    const promise = this.dispatcher(action)
    this.queueMap[fetchId] = promise

    return promise.then(value => {
      // Remove this action from running actions
      delete this.queueMap[fetchId]

      const shouldCache = this.shouldCacheFetchResult(action)
      if (shouldCache) {
        this.cache.set(fetchId, value)
      }

      this.emitter.emit('update', { fetchId: fetchId, data: value })
      return value
    })
  }

  /**
   *
   * @param fetchId
   * @param handlersMap Map of event handle
   * @returns A function that removes the listener
   */
  listen(fetchId: string, handlersMap: EventHandlersMap): () => void {
    const handler = (eventName: string | undefined, event: any) => {
      if (
        eventName &&
        event.fetchId === fetchId &&
        handlersMap[eventName as keyof EventHandlersMap]
      ) {
        handlersMap[eventName as keyof EventHandlersMap]!(event.data)
      }
    }

    this.emitter.on('*', handler)
    return () => this.emitter.off('*', handler)
  }

  /**
   * Get an item from cache by it's fetch id
   * @param fetchId
   */
  get(fetchId: string): TDispatcherResult | undefined {
    return this.cache.get(fetchId)?.value
  }

  /**
   * Create or update a value on cache
   * @param fetchId
   * @param newResult New value to be set to `data` property
   */
  set(
    fetchId: string,
    newValueOrUpdateResultFn:
      | ((prevValue?: TDispatcherResult) => TDispatcherResult)
      | TDispatcherResult,
  ): void {
    let newValue: any = newValueOrUpdateResultFn
    if (typeof newValueOrUpdateResultFn === 'function') {
      const prevCacheItem = this.cache.get(fetchId)
      newValue = (newValueOrUpdateResultFn as Function)(prevCacheItem?.value)
    }

    this.cache.set(fetchId, newValue)
    this.emitter.emit('update', { fetchId, data: newValue })
  }

  get queue() {
    return Object.values(this.queueMap)
  }

  /**
   * Waits until the running fetchs are resolved
   */
  waitForFetchs(): Promise<void> {
    return Promise.all(this.queue).then(() => void 0)
  }
}
interface CreateClientConfig {
  cache?: FetchCache<FetchResult<any, any>, any>
  initialCacheState?: LocalCacheState
  dispatcher?: FetchDispatcher<any>
}
export const createClient = ({
  cache,
  initialCacheState,
  dispatcher = defaultDispatcher,
}: CreateClientConfig) => {
  const client = new FetchClient(
    cache || createCache({ initialState: initialCacheState }),
    dispatcher,
  )

  return client
}
