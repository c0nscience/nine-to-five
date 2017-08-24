import { createStore, applyMiddleware, compose } from 'redux'
import reducer from './reducers/activity'
import thunk from "redux-thunk";

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default createStore(
  reducer,
  composeEnhancers(applyMiddleware(thunk))
)
