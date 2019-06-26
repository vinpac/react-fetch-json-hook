import React from 'react'
import { FetchConnector } from './fetch-connector'

export default React.createContext<FetchConnector | null>(null)
