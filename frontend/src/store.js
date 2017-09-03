import { createBrowserHistory } from 'history'
import { applyMiddleware, compose, createStore } from 'redux'
import reducer from './reducers/activity'
import thunk from 'redux-thunk'
import { connectRouter, routerMiddleware } from 'connected-react-router'

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export const history = createBrowserHistory()

export default createStore(
  connectRouter(history)(reducer),
  composeEnhancers(
    applyMiddleware(
      thunk,
      routerMiddleware(history)
    )
  )
)
