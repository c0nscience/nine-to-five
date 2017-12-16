import { createBrowserHistory } from 'history'
import { applyMiddleware, compose, combineReducers, createStore } from 'redux'
import activity from './reducers/activity'
import auth from './reducers/auth'
import error from './reducers/error'
import network from './reducers/network'
import thunkMiddleware from 'redux-thunk'
import { connectRouter, routerMiddleware } from 'connected-react-router'
import { createEpicMiddleware } from 'redux-observable'
import { rootEpic } from './epics'

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export const history = createBrowserHistory()

const reducers = combineReducers({
  activity,
  auth,
  error,
  network
})

const epicMiddleware = createEpicMiddleware(rootEpic)

export default createStore(
  connectRouter(history)(reducers),
  composeEnhancers(
    applyMiddleware(
      epicMiddleware,
      thunkMiddleware,
      routerMiddleware(history)
    )
  )
)
