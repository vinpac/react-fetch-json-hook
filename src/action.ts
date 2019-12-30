export interface FetchAction<TMeta = any> extends RequestInit {
  url: string
  meta?: TMeta
}

export interface DispatchedFetchAction<TMeta = any>
  extends Omit<FetchAction<TMeta>, 'id'> {
  id: string
}

export interface FetchActionCreator<TArg = any, TMeta = any> {
  (arg?: TArg): FetchAction<TMeta> | null
}
