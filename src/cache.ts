import { FetchResult, HeadersObject } from './client'

export interface FetchCache<TValue, TState> {
  set(id: string, value: TValue): CacheItem<TValue>
  get(id: string): CacheItem<TValue> | undefined
  remove(id: string): void
  getState(): any
  setState(newState: TState): void
}

export interface CacheItem<TValue> {
  id: string
  value: TValue
  cachedAt: number
}

export interface LocalCacheState {
  [key: string]: CacheItem<unknown>
}

export class FetchLocalCache
  implements FetchCache<FetchResult<any, HeadersObject>, any> {
  constructor(protected state: LocalCacheState) {}

  set<TValue>(id: string, value: TValue): CacheItem<TValue> {
    const item: CacheItem<TValue> = {
      id,
      value,
      cachedAt: Date.now(),
    }

    this.state[id] = item
    return item
  }

  get<TValue>(id: string) {
    return this.state[id] as CacheItem<TValue> | undefined
  }

  remove(id: string) {
    delete this.state[id]
  }

  getState() {
    return this.state
  }

  setState(state: LocalCacheState) {
    this.state = state
  }
}

interface CreateCacheConfig {
  initialState?: LocalCacheState
}

export const createCache = ({
  initialState,
}: CreateCacheConfig = {}): FetchLocalCache => {
  return new FetchLocalCache(initialState || {})
}
