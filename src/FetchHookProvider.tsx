import React from 'react'
import { FetchConnector } from './fetch-connector'
import { FetchConnectorContext } from './use-fetch'

interface FetchHookProviderProps {
  readonly connector: FetchConnector
  readonly children: React.ReactNode
}

const FetchHookProvider: React.FC<FetchHookProviderProps> = ({
  connector,
  children,
}) => (
  <FetchConnectorContext.Provider value={connector}>
    {children}
  </FetchConnectorContext.Provider>
)

FetchHookProvider.displayName = 'FetchHookProvider'

export default React.memo(FetchHookProvider)
