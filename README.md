# react-fetch-json-hook

Use [Isomorphic fetch](https://github.com/matthew-andrews/isomorphic-fetch) as React
[hooks](https://reactjs.org/docs/hooks-intro.html) with caching and support for SSR.

# Installation

`npm install react-fetch-json-hook`

Or if using [yarn](https://yarnpkg.com/en/)

`yarn add react-fetch-json-hook`

# Usage

## FetchConnector

```javascript
import React from 'react'
import { render } from 'react-dom'

import { createFetchConnector, FetchHookProvider } from 'react-fetch-json-hook'

const connector = createFetchConnector()

const App = () => (
  <FetchHookProvider connector={connector}>
    <MyRootComponent />
  </FetchHookProvider>
)

render(<App />, document.getElementById('root'))
```

## useFetch

```javascript
import { useFetch } from 'react-fetch-json-hook'

const Dogs = () => {
  const { data, error, loading } = useFetch('/api/dogs')

  if (loading) {
    return <div>Loading...</div>
  }
  if (error) {
    return <div>Error! {error.message}</div>
  }

  return (
    <ul>
      {data.dogs.map(dog => (
        <li key={dog.id}>{dog.breed}</li>
      ))}
    </ul>
  )
}
```

## useTriggerableFetch

```javascript
import { useTriggerableFetch } from 'react-fetch-json-hook'

const Dogs = () => {
  const { trigger, error, loading } = useTriggerableFetch('/api/dogs')

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error! {error.message}</div>
  }

  return (
    <ul>
      <button onClick={trigger}>Fetch Dogs</button>
      {data && data.dogs.map(dog => <li key={dog.id}>{dog.breed}</li>)}
    </ul>
  )
}
```

## Authorization

```javascript
import { createFetchConnector } from 'react-fetch-json-hook'

const connector = createFetchConnector({
  requestHeaders: {
    Authorization: '<token>',
  },
})
```

## Server-side rendering

```javascript
import express from 'express'
import {
  createFetchConnector,
  createFetchSSRManager,
  FetchHookProvider,
} from 'react-fetch-json-hook'
import { renderToString } from 'react-dom/server'

const Hello = () => {
  const { data } = useFetch('/foo')
  return <div>{data && data.join(',')}</div>
}

const app = express()

app.get('/', async (req, res) => {
  const connector = createFetchConnector()
  const renderedHtml = await getMarkupFromTree({
    renderFunction: renderToString,
    tree: (
      <FetchHookProvider connector={connector}>
        <Hello />
      </FetchHookProvider>
    ),
  })

  // const initialStateForHydratation = connector.cache
  res.send(renderedHtml)
})
```

Highly inspired by [react-apollo-hooks](https://github.com/trojanowski/react-apollo-hooks)
