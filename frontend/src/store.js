import { createBrowserHistory } from 'history'
import { applyMiddleware, combineReducers, createStore } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import activity from './reducers/activity'
import auth from './reducers/auth'
import error from './reducers/error'
import network from './reducers/network'
import thunkMiddleware from 'redux-thunk'
import { connectRouter, routerMiddleware } from 'connected-react-router'
import { createEpicMiddleware } from 'redux-observable'
import { rootEpic } from './epics'

const composeEnhancers = composeWithDevTools({
  trace: true
})

export const history = createBrowserHistory()

const reducers = history => combineReducers({
  router: connectRouter(history),
  activity,
  auth,
  error,
  network
})

const epicMiddleware = createEpicMiddleware()
const store = createStore(
  reducers(history),
  composeEnhancers(
    applyMiddleware(
      epicMiddleware,
      thunkMiddleware,
      routerMiddleware(history)
    )
  )
)

epicMiddleware.run(rootEpic)

export default store
