import { applyMiddleware, compose, createStore } from 'redux'
import reducer from './reducers/activity'
import thunk from 'redux-thunk'

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export default createStore(
  reducer,
  composeEnhancers(applyMiddleware(thunk))
)
