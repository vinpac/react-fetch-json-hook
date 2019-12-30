import React from 'react'
import { FetchContextValue, FetchContext } from './context'

export interface FetchProviderProps {
  client: FetchContextValue<any>
}
export const FetchProvider: React.FC<FetchProviderProps> = ({
  client,
  children,
}) => <FetchContext.Provider value={client}>{children}</FetchContext.Provider>
