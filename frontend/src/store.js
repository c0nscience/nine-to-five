import { createBrowserHistory } from 'history'
import { applyMiddleware, compose, combineReducers, createStore } from 'redux'
import activity from './reducers/activity'
import thunk from 'redux-thunk'
import { connectRouter, routerMiddleware } from 'connected-react-router'

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export const history = createBrowserHistory()

const reducers = combineReducers({
  activity
})
export default createStore(
  connectRouter(history)(reducers),
  composeEnhancers(
    applyMiddleware(
      thunk,
      routerMiddleware(history)
    )
  )
)
