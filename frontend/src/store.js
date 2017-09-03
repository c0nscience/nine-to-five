import { createBrowserHistory } from 'history'
import { applyMiddleware, compose, combineReducers, createStore } from 'redux'
import activity from './reducers/activity'
import auth from './reducers/auth'
import thunkMiddleware from 'redux-thunk'
import { connectRouter, routerMiddleware } from 'connected-react-router'
import api from './middleware/api'

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export const history = createBrowserHistory()

const reducers = combineReducers({
  activity,
  auth
})
export default createStore(
  connectRouter(history)(reducers),
  composeEnhancers(
    applyMiddleware(
      thunkMiddleware,
      routerMiddleware(history),
      api
    )
  )
)
